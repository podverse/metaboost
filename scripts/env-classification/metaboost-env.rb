#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative 'lib/metaboost_env_merge'

def usage(msg = nil)
  warn("Error: #{msg}") if msg
  warn <<~USAGE
    Usage:
      metaboost-env.rb merge-env --profile PROFILE --group NAME [--classification-overlay PATH] [--extra-env PATH]... [--output PATH] [--fill-empty-local-generator-secrets --hex32-state-file PATH] [--reuse-plain-secrets-dir PATH]
      metaboost-env.rb write-valkey-split --profile PROFILE --valkey-source-only-out P --valkey-out P
    merge-env: prints KEY=value lines (classification var order) to stdout unless --output is set.
      Optional --classification-overlay: extra classification YAML (e.g. GitOps apps/metaboost-<env>/env/remote-k8s.yaml).
      Optional --fill-empty-local-generator-secrets: fill kind: secret + local_generator: hex_32 empties (requires --hex32-state-file). Used by render-k8s-env.sh only; omit for deterministic merge (e.g. validate-parity).
      Optional --reuse-plain-secrets-dir: directory of plain K8s Secret YAML (*.yaml) whose stringData is reused before generate/state.
  USAGE
  exit 1
end

args = ARGV.dup
cmd = args.shift
usage('missing command') if cmd.nil? || cmd.empty?

case cmd
when 'merge-env', 'print-env'
  profile = nil
  group = nil
  classification_overlay = nil
  extra = []
  output_path = nil
  fill_empty_local_generator_secrets = false
  hex32_state_file = nil
  reuse_plain_secrets_dir = nil

  until args.empty?
    case args.shift
    when '--profile'
      profile = args.shift
    when '--group'
      group = args.shift
    when '--classification-overlay'
      classification_overlay = args.shift
    when '--extra-env'
      extra << args.shift
    when '--output'
      output_path = args.shift
    when '--fill-empty-local-generator-secrets'
      fill_empty_local_generator_secrets = true
    when '--hex32-state-file'
      hex32_state_file = args.shift
    when '--reuse-plain-secrets-dir'
      reuse_plain_secrets_dir = args.shift
    when '-h', '--help'
      usage
    else
      usage('unknown arg')
    end
  end

  usage('missing --profile') if profile.nil? || profile.empty?
  usage('missing --group') if group.nil? || group.empty?
  if fill_empty_local_generator_secrets
    usage('--hex32-state-file is required with --fill-empty-local-generator-secrets') if hex32_state_file.nil? || hex32_state_file.empty?
  elsif !hex32_state_file.nil? && !hex32_state_file.empty?
    usage('--hex32-state-file requires --fill-empty-local-generator-secrets')
  end

  classification = MetaboostEnvMerge.merged_classification(
    profile,
    extra_overlay_path: classification_overlay
  )
  flat = MetaboostEnvMerge.flatten_env_group_env(classification, group)
  merged = MetaboostEnvMerge.apply_env_file_overlays(flat, extra)
  merged = MetaboostEnvMerge.apply_locale_next_public_sync(merged, group)
  merged = MetaboostEnvMerge.apply_auth_mode_next_public_sync(merged, group)
  merged = MetaboostEnvMerge.apply_info_next_public_sync(merged, group)
  merged = MetaboostEnvMerge.reorder_env_map_to_group_vars(merged, classification, group)
  if fill_empty_local_generator_secrets
    merged = MetaboostEnvMerge.apply_local_generator_hex32_fill!(
      merged,
      classification,
      group,
      state_path: hex32_state_file,
      plain_dir: reuse_plain_secrets_dir
    )
  end

  if output_path
    MetaboostEnvMerge.write_env_file(output_path, merged)
  else
    merged.each_key do |k|
      puts MetaboostEnvMerge.format_env_line(k, merged[k])
    end
  end
when 'write-valkey-split'
  profile = nil
  valkey_source_only_out = nil
  valkey_out = nil

  until args.empty?
    case args.shift
    when '--profile'
      profile = args.shift
    when '--valkey-source-only-out'
      valkey_source_only_out = args.shift
    when '--valkey-out'
      valkey_out = args.shift
    when '-h', '--help'
      usage
    else
      usage('unknown arg')
    end
  end

  usage('missing --profile') if profile.nil? || profile.empty?
  usage('missing --valkey-source-only-out') if valkey_source_only_out.nil? || valkey_source_only_out.empty?
  usage('missing --valkey-out') if valkey_out.nil? || valkey_out.empty?

  classification = MetaboostEnvMerge.merged_classification(profile)
  flat = MetaboostEnvMerge.flatten_env_group_env(classification, 'valkey')
  vk_so_map, vk_map = MetaboostEnvMerge.split_valkey_env(flat, classification)
  MetaboostEnvMerge.write_env_file(valkey_source_only_out, vk_so_map)
  MetaboostEnvMerge.write_env_file(valkey_out, vk_map)
else
  usage("unknown command: #{cmd}")
end
