#!/usr/bin/env ruby
# frozen_string_literal: true

# Writes home override .env stubs from canonical env examples.
# Invoked by prepare-home-env-overrides.sh; only creates missing files unless --force.

require 'fileutils'

REPO_ROOT = File.expand_path('../..', __dir__)

OVERRIDE_KEY_SOURCES = {
  'info.env' => {
    'WEB_BRAND_NAME' => 'apps/api/.env.example',
    'LEGAL_NAME' => 'apps/api/.env.example',
    'MANAGEMENT_WEB_BRAND_NAME' => 'apps/api/.env.example'
  },
  'auth.env' => {
    'ACCOUNT_SIGNUP_MODE' => 'apps/api/.env.example'
  },
  'locale.env' => {
    'DEFAULT_LOCALE' => 'apps/api/.env.example',
    'SUPPORTED_LOCALES' => 'apps/api/.env.example'
  },
  'mailer.env' => {
    'MAILER_HOST' => 'apps/api/.env.example',
    'MAILER_PORT' => 'apps/api/.env.example',
    'MAILER_USERNAME' => 'apps/api/.env.example',
    'MAILER_PASSWORD' => 'apps/api/.env.example',
    'MAILER_FROM' => 'apps/api/.env.example'
  },
  'user-agent.env' => {
    'API_USER_AGENT' => 'apps/api/.env.example',
    'MANAGEMENT_API_USER_AGENT' => 'apps/management-api/.env.example'
  },
  'db-management-superuser.env' => {
    'DB_MANAGEMENT_ADMIN_USER' => 'infra/config/env-templates/db.env.example',
    'DB_MANAGEMENT_ADMIN_PASSWORD' => 'infra/config/env-templates/db.env.example'
  }
}.freeze

def usage(msg = nil)
  warn("Error: #{msg}") if msg
  warn <<~USAGE
    Usage:
      write-home-override-stubs.rb --output-dir DIR [--profile PROFILE] [--force] [--no-merge-missing]

    PROFILE is accepted for compatibility but not used for default selection.

    Creates each stub in DIR with header + KEY=value lines from canonical .env.example templates.
    Default: skip files that already exist. With --force, overwrite every listed stub.

    After creating stubs, merges missing keys into existing files (template defaults).
    Existing KEY= assignments are never changed. Skip with --no-merge-missing.
  USAGE
  exit 1
end

output_dir = nil
force = false
merge_missing = true

args = ARGV.dup
until args.empty?
  case args.shift
  when '--profile'
    args.shift
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

usage('missing --output-dir') if output_dir.nil? || output_dir.empty?

FileUtils.mkdir_p(output_dir)

def parse_env_file(path)
  out = {}
  return out unless File.file?(path)

  File.read(path, encoding: 'UTF-8').each_line do |line|
    stripped = line.strip
    next if stripped.empty? || stripped.start_with?('#')
    next unless stripped.include?('=')

    key, value = stripped.split('=', 2)
    next if key.nil? || key.empty?

    value ||= ''
    value = value.strip
    if (value.start_with?('"') && value.end_with?('"')) || (value.start_with?("'") && value.end_with?("'"))
      value = value[1..-2]
    end
    out[key] = value
  end
  out
end

def format_env_line(key, value)
  return "#{key}=" if value.nil? || value.empty?

  escaped = value.gsub('"', '\\"')
  "#{key}=\"#{escaped}\""
end

def source_defaults_map
  cache = {}
  OVERRIDE_KEY_SOURCES.each_value do |spec|
    spec.values.uniq.each do |rel_path|
      abs_path = File.join(REPO_ROOT, rel_path)
      cache[rel_path] = parse_env_file(abs_path)
    end
  end
  cache
end

source_defaults = source_defaults_map

header = <<~HEADER
  # Metaboost optional overrides — values below match canonical .env.example defaults.
  # Edit as needed; canonical templates: apps/*/.env.example, apps/*/sidecar/.env.example,
  # and infra/config/env-templates/*.env.example.
  # See docs/development/env/LOCAL-ENV-OVERRIDES.md
HEADER

created = 0

OVERRIDE_KEY_SOURCES.each do |basename, spec|
  path = File.join(output_dir, basename)
  next if File.file?(path) && !force

  lines = [header.rstrip]
  spec.each do |key, rel_path|
    value = source_defaults.fetch(rel_path, {})[key] || ''
    lines << format_env_line(key, value)
  end
  body = lines.join("\n") + "\n"
  File.write(path, body, encoding: 'UTF-8')
  created += 1
  warn "Wrote #{path}"
end

warn "Created #{created} home override file(s) under #{output_dir}" if created.positive?

def merge_missing_keys_into_file(path, source_spec, source_defaults)
  return [] if source_spec.nil? || source_spec.empty?

  existing = parse_env_file(path)
  keys_added = []
  lines_to_write = []
  source_spec.each do |key, rel_path|
    next if existing.key?(key)

    value = source_defaults.fetch(rel_path, {})[key] || ''
    lines_to_write << format_env_line(key, value)
    keys_added << key
    existing[key] = value.to_s
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
  OVERRIDE_KEY_SOURCES.each do |basename, spec|
    path = File.join(output_dir, basename)
    next unless File.file?(path)

    added = merge_missing_keys_into_file(path, spec, source_defaults)
    next if added.empty?

    merged_keys_total += added.size
    warn "Merged #{added.size} missing key(s) into #{path}: #{added.join(', ')}"
  end
end

warn "Merged #{merged_keys_total} missing anchor key line(s) total." if merged_keys_total.positive?
