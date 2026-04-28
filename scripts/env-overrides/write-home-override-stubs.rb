#!/usr/bin/env ruby
# frozen_string_literal: true

# Writes home override .env stubs from merged classification (anchor keys + defaults).
# Invoked by prepare-home-env-overrides.sh; only creates missing files unless --force.

require 'fileutils'

require_relative '../env-classification/lib/metaboost_env_merge'

def usage(msg = nil)
  warn("Error: #{msg}") if msg
  warn <<~USAGE
    Usage:
      write-home-override-stubs.rb --profile PROFILE --output-dir DIR [--force] [--no-merge-missing]

    PROFILE: local_docker (local dev) or remote_k8s (K8s render / alpha_env_prepare)

    Creates each stub in DIR with header + KEY=value lines from classification defaults.
    Default: skip files that already exist. With --force, overwrite every listed stub.

    After creating stubs, merges missing anchor keys into existing files (classification defaults).
    Existing KEY= assignments are never changed. Skip with --no-merge-missing.
  USAGE
  exit 1
end

profile = nil
output_dir = nil
force = false
merge_missing = true

args = ARGV.dup
until args.empty?
  case args.shift
  when '--profile'
    profile = args.shift
  when '--output-dir'
    output_dir = args.shift
  when '--force'
    force = true
  when '--no-merge-missing'
    merge_missing = false
  when '-h', '--help'
    usage
  else
    usage('unknown arg')
  end
end

usage('missing --profile') if profile.nil? || profile.empty?
usage('missing --output-dir') if output_dir.nil? || output_dir.empty?

FileUtils.mkdir_p(output_dir)

classification = MetaboostEnvMerge.merged_classification(profile)
by_logical = MetaboostEnvMerge.anchor_overrides_by_logical_file(classification)

header = <<~HEADER
  # Metaboost optional overrides — values below match merged classification defaults.
  # Edit as needed; canonical keys/defaults: infra/env/classification (+ profile overlay).
  # See docs/development/env/LOCAL-ENV-OVERRIDES.md
HEADER

created = 0

MetaboostEnvMerge::HOME_OVERRIDE_LOGICAL_TO_BASENAME.each do |logical, basename|
  path = File.join(output_dir, basename)
  next if File.file?(path) && !force

  env_map = by_logical[logical] || {}
  lines = [header.rstrip]
  env_map.each_key do |k|
    lines << MetaboostEnvMerge.format_env_line(k, env_map[k])
  end
  body = lines.join("\n") + "\n"
  File.write(path, body, encoding: 'UTF-8')
  created += 1
  warn "Wrote #{path}"
end

warn "Created #{created} home override file(s) under #{output_dir}" if created.positive?

def merge_missing_anchor_keys_into_file(path, env_map)
  return [] if env_map.nil? || env_map.empty?

  existing = MetaboostEnvMerge.parse_env_file(path)
  keys_added = []
  lines_to_write = []
  env_map.each_key do |key|
    next if existing.key?(key)

    lines_to_write << MetaboostEnvMerge.format_env_line(key, env_map[key])
    keys_added << key
    existing[key] = env_map[key].to_s
  end
  return [] if keys_added.empty?

  raw = File.read(path, encoding: 'UTF-8')
  prefix = raw.empty? || raw.end_with?("\n") ? '' : "\n"
  File.open(path, 'a:UTF-8') do |io|
    io.write(prefix + lines_to_write.join("\n") + "\n")
  end
  keys_added
end

merged_keys_total = 0
if merge_missing
  MetaboostEnvMerge::HOME_OVERRIDE_LOGICAL_TO_BASENAME.each do |logical, basename|
    path = File.join(output_dir, basename)
    next unless File.file?(path)

    env_map = by_logical[logical] || {}
    added = merge_missing_anchor_keys_into_file(path, env_map)
    next if added.empty?

    merged_keys_total += added.size
    warn "Merged #{added.size} missing key(s) into #{path}: #{added.join(', ')}"
  end
end

warn "Merged #{merged_keys_total} missing anchor key line(s) total." if merged_keys_total.positive?
