# frozen_string_literal: true

require 'securerandom'
require 'set'
require 'yaml'

module MetaboostEnvMerge
  module_function

  CLASSIFICATION_ENV_GROUPS_KEY = 'env_groups'

  # http / valkey classification nests env vars under split bucket keys (hyphenated);
  # each bucket is { vars: { VAR => spec, ... } }. Implies former per-var file_split.
  SPLIT_ENV_GROUP_BUCKETS = {
    'http' => %w[api web-sidecar web management-api management-web-sidecar management-web].freeze,
    'valkey' => %w[valkey-source-only valkey].freeze
  }.freeze

  def split_catalogued_env_group?(group_name)
    SPLIT_ENV_GROUP_BUCKETS.key?(group_name.to_s)
  end

  def split_bucket_order(group_name)
    SPLIT_ENV_GROUP_BUCKETS[group_name.to_s] || [].freeze
  end

  def repo_root
    @repo_root ||= File.expand_path('../../..', __dir__)
  end

  def base_path
    File.join(repo_root, 'infra/env/classification/base.yaml')
  end

  def overlay_path(profile)
    name = profile.to_s.tr('_', '-')
    path = File.join(repo_root, 'infra/env/overrides', "#{name}.yaml")
    File.file?(path) ? path : nil
  end

  def deep_merge(a, b)
    return a if b.nil?
    return b if a.nil?
    unless a.is_a?(Hash) && b.is_a?(Hash)
      return b
    end

    a.merge(b) do |_key, old_v, new_v|
      deep_merge(old_v, new_v)
    end
  end

  def load_yaml(path)
    return {} unless path && File.file?(path)

    YAML.safe_load(
      File.read(path),
      permitted_classes: [Symbol, Time],
      aliases: true
    ) || {}
  end

  # Optional extra_overlay_path: GitOps-hosted YAML (same shape as infra/env/overrides/<profile>.yaml),
  # merged after the monorepo profile overlay. See docs/development/K8S-ENV-RENDER.md.
  def merged_classification(profile, extra_overlay_path: nil)
    base = load_yaml(base_path)
    ov = overlay_path(profile)
    merged = deep_merge(base, ov && load_yaml(ov))
    if extra_overlay_path && !extra_overlay_path.to_s.empty? && File.file?(extra_overlay_path)
      merged = deep_merge(merged, load_yaml(extra_overlay_path))
    end
    merged
  end

  def merge_var_specs(base_specs, override_specs)
    return base_specs || {} unless override_specs.is_a?(Hash)

    out = (base_specs || {}).dup
    override_specs.each do |key, spec|
      if out[key].is_a?(Hash) && spec.is_a?(Hash)
        out[key] = deep_merge(out[key], spec)
      else
        out[key] = spec
      end
    end
    out
  end

  def env_group_vars(classification, group_name)
    wl = classification.dig(CLASSIFICATION_ENV_GROUPS_KEY, group_name)
    return {} unless wl.is_a?(Hash)

    if split_catalogued_env_group?(group_name)
      flatten_split_env_group_vars(wl, group_name)
    else
      wl['vars'] || {}
    end
  end

  # Flatten split-bucket vars in canonical bucket order (insertion order for merge / emit).
  def flatten_split_env_group_vars(wl, group_name)
    out = {}
    split_bucket_order(group_name).each do |split|
      node = wl[split]
      next unless node.is_a?(Hash)

      (node['vars'] || {}).each do |k, spec|
        out[k.to_s] = spec
      end
    end
    out
  end

  # Shallow copy of a var spec hash (classification leaves are scalars).
  def dup_var_spec(spec)
    return spec unless spec.is_a?(Hash)

    spec.transform_values do |v|
      v.is_a?(Hash) ? v.dup : v
    end
  end

  MAP_STRIP_KEYS = %w[override_role override_file derived_from].freeze

  def inherit_file_splits_allowed(entry)
    return nil unless entry.is_a?(Hash)

    return nil unless entry.key?('file_splits')

    splits_filter = entry['file_splits']
    return nil if splits_filter.nil?
    raise ArgumentError, 'inherits file_splits must be an array when set' unless splits_filter.is_a?(Array)

    return Set.new if splits_filter.empty?

    splits_filter.map(&:to_s).to_set
  end

  # Raw var specs from a source env group for one inherit entry (respects file_splits for split-catalogued sources).
  def inherit_entry_source_raw(classification, entry)
    return {} unless entry.is_a?(Hash)

    from = entry['from'].to_s
    return {} if from.empty?

    src_wl = classification.dig(CLASSIFICATION_ENV_GROUPS_KEY, from)
    return {} unless src_wl.is_a?(Hash)

    allowed = inherit_file_splits_allowed(entry)

    if split_catalogued_env_group?(from)
      out = {}
      split_bucket_order(from).each do |split|
        next if allowed && !allowed.include?(split)

        node = src_wl[split]
        next unless node.is_a?(Hash)

        (node['vars'] || {}).each do |key, spec|
          next unless spec.is_a?(Hash)

          out[key] = dup_var_spec(spec)
        end
      end
      out
    else
      src_vars = src_wl['vars'] || {}
      return {} if src_vars.empty?

      src_vars.each_with_object({}) do |(key, spec), o|
        next unless spec.is_a?(Hash)

        o[key] = dup_var_spec(spec)
      end
    end
  end

  # Apply explicit SourceName => TargetName map; only listed keys are imported.
  def apply_inherit_map(raw, entry)
    return {} unless entry.is_a?(Hash)

    m = entry['map']
    return {} unless m.is_a?(Hash)

    m.each_with_object({}) do |(src_key, tgt_key), acc|
      sk = src_key.to_s
      target = tgt_key.to_s
      next if target.empty?

      spec = raw[sk]
      unless spec.is_a?(Hash)
        raise ArgumentError,
              "inherit map: source var #{sk.inspect} not found in filtered source (check file_splits and map keys)"
      end

      copy = dup_var_spec(spec)
      if target != sk
        MAP_STRIP_KEYS.each { |k| copy.delete(k) }
        if target.start_with?('NEXT_PUBLIC_') && copy['kind'].to_s == 'literal'
          copy['kind'] = 'config'
        end
      end
      acc[target] = copy
    end
  end

  # Vars from a single inherits[] entry (shallow: source group's own vars only, not transitive).
  def specs_from_inherit_entry(classification, entry)
    return {} unless entry.is_a?(Hash)

    from = entry['from'].to_s
    return {} if from.empty?

    raw = inherit_entry_source_raw(classification, entry)
    apply_inherit_map(raw, entry)
  end

  # Effective var specs for merge-env / K8s render: inherits (later entries override earlier on same key),
  # then group.vars (merge_var_specs deep-merges own on top of inherited).
  def effective_env_group_var_specs(classification, group_name)
    wl = classification.dig(CLASSIFICATION_ENV_GROUPS_KEY, group_name)
    return {} unless wl.is_a?(Hash)

    own =
      if split_catalogued_env_group?(group_name)
        flatten_split_env_group_vars(wl, group_name)
      else
        wl['vars'] || {}
      end
    inherits = wl['inherits']

    inherited = {}
    if inherits.is_a?(Array) && !inherits.empty?
      inherits.each do |entry|
        specs_from_inherit_entry(classification, entry).each do |key, spec|
          inherited[key] = spec
        end
      end
    end

    merge_var_specs(inherited, own)
  end

  # Key order for env output: inherit order (per-source vars order, later inherit repositions duplicates),
  # then each own var in YAML order (moved to end, so overrides follow inherited block).
  def effective_var_emit_order(classification, group_name)
    wl = classification.dig(CLASSIFICATION_ENV_GROUPS_KEY, group_name)
    return [] unless wl.is_a?(Hash)

    own =
      if split_catalogued_env_group?(group_name)
        flatten_split_env_group_vars(wl, group_name)
      else
        wl['vars'] || {}
      end
    inherits = wl['inherits']

    inherited_ordered = []
    if inherits.is_a?(Array) && !inherits.empty?
      inherits.each do |entry|
        next unless entry.is_a?(Hash)

        from = entry['from'].to_s
        next if from.empty?

        m = entry['map']
        next unless m.is_a?(Hash)

        m.each_value do |tgt|
          target = tgt.to_s
          next if target.empty?

          inherited_ordered.delete(target)
          inherited_ordered << target
        end
      end
    end

    final = inherited_ordered.dup
    own.each_key do |k|
      final.delete(k)
      final << k
    end
    final
  end

  def flatten_env_group_env(classification, group_name)
    specs = effective_env_group_var_specs(classification, group_name)
    out = {}
    specs.each do |key, spec|
      next unless spec.is_a?(Hash)

      d = spec['default']
      out[key] = d.nil? || d.to_s.empty? ? '' : d.to_s
    end
    out
  end

  # Aggregate stringData from every *.yaml under dir (K8s plain Secret manifests). Later files override
  # earlier keys on conflict. Used by K8s env render to reuse committed cleartext before generating.
  def load_plain_secret_stringdata_aggregate(dir)
    return {} if dir.nil? || dir.to_s.empty? || !File.directory?(dir)

    out = {}
    Dir.glob(File.join(dir, '*.yaml')).sort.each do |path|
      next unless File.file?(path)

      doc = YAML.safe_load(
        File.read(path),
        permitted_classes: [Symbol, Time],
        aliases: true
      )
      next unless doc.is_a?(Hash)

      sd = doc['stringData']
      next unless sd.is_a?(Hash)

      sd.each do |k, v|
        key = k.to_s
        next if key.empty?

        s = v.nil? ? '' : v.to_s
        next if s.empty?

        out[key] = s
      end
    end
    out
  end

  # Fills empty values for keys with kind: secret and local_generator: hex_32 (same set as
  # scripts/local-env/setup.sh). Order: keep non-empty merged env; else plain aggregate; else state
  # file; else SecureRandom.hex(32) (append KEY=value to state_path). Opt-in from merge-env only.
  def apply_local_generator_hex32_fill!(env, classification, group_name, state_path:, plain_dir: nil)
    return env if state_path.nil? || state_path.to_s.empty?

    plain = load_plain_secret_stringdata_aggregate(plain_dir)
    state_map = File.file?(state_path) ? parse_env_file(state_path) : {}
    specs = effective_env_group_var_specs(classification, group_name)
    out = env.dup

    specs.each do |key, spec|
      next unless spec.is_a?(Hash)
      next unless spec['kind'].to_s == 'secret'
      next unless spec['local_generator'].to_s == 'hex_32'
      next if out[key].to_s != ''

      chosen = plain[key]
      chosen = nil if chosen.nil? || chosen.to_s.empty?
      if chosen.nil?
        s = state_map[key]
        chosen = s if !s.nil? && s != ''
      end
      if chosen.nil?
        chosen = SecureRandom.hex(32)
        File.open(state_path, 'a:UTF-8') { |f| f.puts(format_env_line(key, chosen)) }
        state_map[key] = chosen
      end
      out[key] = chosen
    end
    out
  end

  def parse_env_file(path)
    return {} unless File.file?(path)

    out = {}
    File.foreach(path, encoding: 'UTF-8') do |line|
      line = line.strip.sub(/\r$/, '')
      next if line.empty? || line.start_with?('#')
      next unless line =~ /\A[A-Za-z_][A-Za-z0-9_]*=/

      key, val = line.split('=', 2)
      out[key] = val.nil? ? '' : unquote_env(val)
    end
    out
  end

  def unquote_env(s)
    s = s.strip
    if (s.start_with?('"') && s.end_with?('"')) || (s.start_with?("'") && s.end_with?("'"))
      s[1..-2]
    else
      s
    end
  end

  def merge_env_maps(*maps)
    out = {}
    maps.compact.each { |m| out.merge!(m) }
    out
  end

  def apply_env_file_overlays(flat, paths)
    env = flat.dup
    Array(paths).each do |p|
      next unless p && File.file?(p)

      parse_env_file(p).each { |k, v| env[k] = v }
    end
    env
  end

  # Web sidecars expose NEXT_PUBLIC_*; home locale.env uses DEFAULT_LOCALE / SUPPORTED_LOCALES (canonical).
  # After overlays: when canonical keys are present, copy into NEXT_PUBLIC_* so locale.env overrides win over classification defaults.
  # Also covers inherits+map sidecars that only list NEXT_PUBLIC_* in specs until an overlay adds canonical keys.
  LOCALE_NEXT_PUBLIC_SYNC_GROUPS = %w[web-sidecar management-web-sidecar].freeze

  # When extra-env overlays include canonical AUTH_MODE, mirror into NEXT_PUBLIC_AUTH_MODE for the web sidecar.
  AUTH_MODE_NEXT_PUBLIC_SYNC_GROUPS = %w[web-sidecar].freeze

  def apply_locale_next_public_sync(env, group_name)
    return env unless LOCALE_NEXT_PUBLIC_SYNC_GROUPS.include?(group_name.to_s)

    out = env.dup
    d = out['DEFAULT_LOCALE']
    s = out['SUPPORTED_LOCALES']
    if d && !d.to_s.empty?
      out['NEXT_PUBLIC_DEFAULT_LOCALE'] = d
    end
    if s && !s.to_s.empty?
      out['NEXT_PUBLIC_SUPPORTED_LOCALES'] = s
    end
    out
  end

  def apply_auth_mode_next_public_sync(env, group_name)
    return env unless AUTH_MODE_NEXT_PUBLIC_SYNC_GROUPS.include?(group_name.to_s)

    out = env.dup
    mode = out['AUTH_MODE']
    if mode && !mode.to_s.empty?
      out['NEXT_PUBLIC_AUTH_MODE'] = mode
    end
    out
  end

  # Sidecars remap brand anchors (info) and WEB_BASE_URL (http.web bucket) to NEXT_PUBLIC_* (e.g. NEXT_PUBLIC_WEB_BASE_URL); extra-env may set canonical keys only.
  INFO_WEB_NEXT_PUBLIC_SYNC_GROUPS = %w[web-sidecar].freeze
  INFO_MANAGEMENT_WEB_NEXT_PUBLIC_SYNC_GROUPS = %w[management-web-sidecar].freeze

  def apply_info_next_public_sync(env, group_name)
    g = group_name.to_s
    out = env.dup
    if INFO_WEB_NEXT_PUBLIC_SYNC_GROUPS.include?(g)
      b = out['WEB_BRAND_NAME']
      if b && !b.to_s.empty?
        out['NEXT_PUBLIC_WEB_BRAND_NAME'] = b
      end
      l = out['LEGAL_NAME']
      if l && !l.to_s.empty?
        out['NEXT_PUBLIC_LEGAL_NAME'] = l
      end
    end
    if INFO_WEB_NEXT_PUBLIC_SYNC_GROUPS.include?(g) ||
       INFO_MANAGEMENT_WEB_NEXT_PUBLIC_SYNC_GROUPS.include?(g)
      u = out['WEB_BASE_URL']
      if u && !u.to_s.empty?
        out['NEXT_PUBLIC_WEB_BASE_URL'] = u
      end
    end
    if INFO_MANAGEMENT_WEB_NEXT_PUBLIC_SYNC_GROUPS.include?(g)
      m = out['MANAGEMENT_WEB_BRAND_NAME']
      if m && !m.to_s.empty?
        out['NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME'] = m
      end
    end
    out
  end

  def format_env_line(key, value)
    if value.nil? || value == ''
      "#{key}="
    else
      escaped = value.to_s.gsub('\\', '\\\\').gsub('"', '\\"')
      "#{key}=\"#{escaped}\""
    end
  end

  # Order keys: inherited emit order (see effective_var_emit_order), then append any
  # extra keys (e.g. from --extra-env) in their existing env_map iteration order.
  def reorder_env_map_to_group_vars(env_map, classification, group_name)
    return env_map if env_map.nil? || env_map.empty?

    order = effective_var_emit_order(classification, group_name)
    ordered = {}
    order.each do |key|
      ordered[key] = env_map[key] if env_map.key?(key)
    end
    env_map.each do |key, val|
      ordered[key] = val unless ordered.key?(key)
    end
    ordered
  end

  # Preserves Hash insertion order (classification var order for each bucket).
  def write_env_file(path, env_map)
    lines = env_map.keys.map { |k| format_env_line(k, env_map[k]) }
    File.write(path, lines.join("\n") + "\n", encoding: 'UTF-8')
  end

  # Logical override_file names in classification (home-override anchors) -> home stub basename.
  # Must match scripts/env-overrides/home-override-env-files.inc.sh.
  HOME_OVERRIDE_LOGICAL_TO_BASENAME = {
    'info' => 'info.env',
    'auth' => 'auth.env',
    'locale' => 'locale.env',
    'mailer' => 'mailer.env',
    'user_agent' => 'user-agent.env',
    'db_management_superuser' => 'db-management-superuser.env'
  }.freeze

  # Returns { 'info' => { 'WEB_BRAND_NAME' => '...', ... }, ... } from merged classification.
  def anchor_overrides_by_logical_file(classification)
    by_logical = Hash.new { |h, k| h[k] = {} }
    (classification[CLASSIFICATION_ENV_GROUPS_KEY] || {}).each do |group_name, wl|
      next unless wl.is_a?(Hash)

      var_maps =
        if split_catalogued_env_group?(group_name)
          split_bucket_order(group_name).map { |s| (wl[s].is_a?(Hash) ? wl[s]['vars'] : nil) || {} }
        else
          [wl['vars'] || {}]
        end

      var_maps.each do |vars|
        vars.each do |key, spec|
          next unless spec.is_a?(Hash)

          logical = spec['override_file']
          next if logical.nil? || logical.to_s.empty?

          logical = logical.to_s
          default = spec['default']
          val = default.nil? || default.to_s.empty? ? '' : default.to_s
          if by_logical[logical].key?(key) && by_logical[logical][key] != val
            raise ArgumentError,
                  "Classification conflict: #{key} in override_file #{logical} has differing defaults"
          end

          by_logical[logical][key] = val
        end
      end
    end
    by_logical
  end

  def derive_render_buckets(group_name, classification)
    wl = classification.dig(CLASSIFICATION_ENV_GROUPS_KEY, group_name)
    return [{}, {}, {}, {}] unless wl.is_a?(Hash)

    literals = {}
    literals_only = {}
    config = {}
    secrets = {}

    effective_env_group_var_specs(classification, group_name).each do |key, spec|
      next unless spec.is_a?(Hash)

      case spec['kind']
      when 'literal'
        literals[key] = true
      when 'source_only'
        literals_only[key] = true
      when 'config'
        config[key] = true
      when 'secret'
        secrets[key] = true
      end
    end

    [literals, literals_only, config, secrets]
  end

  VALKEY_SPLIT_ORDER = SPLIT_ENV_GROUP_BUCKETS['valkey']

  def split_valkey_env(env_map, classification)
    wl = classification.dig(CLASSIFICATION_ENV_GROUPS_KEY, 'valkey')
    raise ArgumentError, 'missing env_groups.valkey' unless wl.is_a?(Hash)

    buckets = {}
    VALKEY_SPLIT_ORDER.each { |b| buckets[b] = {} }
    VALKEY_SPLIT_ORDER.each do |split|
      node = wl[split]
      next unless node.is_a?(Hash)

      (node['vars'] || {}).each_key do |key|
        k = key.to_s
        next unless env_map.key?(k)

        buckets[split][k] = env_map[k]
      end
    end

    combined = buckets.values.reduce({}, :merge)
    unless combined.keys.to_set == env_map.keys.to_set
      raise ArgumentError,
            'valkey env keys must match classification valkey split buckets exactly ' \
            "(got #{env_map.keys.inspect}, expected keys from classification)"
    end

    VALKEY_SPLIT_ORDER.map { |b| buckets[b] }
  end
end
