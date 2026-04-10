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
      write-home-override-stubs.rb --profile PROFILE --output-dir DIR [--force]

    PROFILE: local_docker (local dev) or remote_k8s (K8s render / alpha_env_prepare)

    Creates each stub in DIR with header + KEY=value lines from classification defaults.
    Default: skip files that already exist. With --force, overwrite every listed stub.
  USAGE
  exit 1
end

profile = nil
output_dir = nil
force = false

args = ARGV.dup
until args.empty?
  case args.shift
  when '--profile'
    profile = args.shift
  when '--output-dir'
    output_dir = args.shift
  when '--force'
    force = true
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
  # See docs/development/LOCAL-ENV-OVERRIDES.md
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
