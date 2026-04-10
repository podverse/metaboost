#!/usr/bin/env ruby
# frozen_string_literal: true

# Emits strategic-merge patches for app listen ports, Services, and Ingress backends from
# classification + dev/env-overrides/<env>/*.env (same inputs as render-k8s-env.sh).
#
# Usage: render_remote_k8s_ports.rb --env alpha|beta|prod [--output-repo PATH] [--contract PATH] [--dry-run]

require 'fileutils'
require 'yaml'

require_relative '../env-classification/lib/boilerplate_env_merge'

REPO_ROOT = File.expand_path('../..', __dir__)

PORT_MERGE_GROUPS = %w[
  api
  web-sidecar
  web
  management-api
  management-web-sidecar
  management-web
].freeze

REQUIRED_PORT_ENV_VARS = %w[
  API_PORT
  WEB_PORT
  WEB_SIDECAR_PORT
  MANAGEMENT_API_PORT
  MANAGEMENT_WEB_PORT
  MANAGEMENT_WEB_SIDECAR_PORT
].freeze

def usage(msg = nil)
  warn("Error: #{msg}") if msg
  warn <<~USAGE
    Usage: render_remote_k8s_ports.rb --env NAME [--output-repo PATH] [--contract PATH] [--dry-run]
  USAGE
  exit 1
end

def parse_args(argv)
  env_name = nil
  output_repo = nil
  contract = File.join(REPO_ROOT, 'infra/k8s/remote/port-contract.yaml')
  dry_run = false
  until argv.empty?
    case argv.shift
    when '--env'
      env_name = argv.shift
    when '--output-repo'
      output_repo = argv.shift
    when '--contract'
      contract = argv.shift
    when '--dry-run'
      dry_run = true
    when '-h', '--help'
      usage
    else
      usage('unknown argument')
    end
  end
  [env_name, output_repo, contract, dry_run]
end

def load_contract(path)
  unless File.file?(path)
    warn("Error: contract not found: #{path}")
    exit 1
  end
  YAML.safe_load(File.read(path), permitted_classes: [Symbol], aliases: true) || {}
end

def extra_env_paths(env_name)
  Dir.glob(File.join(REPO_ROOT, 'dev', 'env-overrides', env_name.to_s, '*.env')).sort
end

def merge_port_env(classification, extra_paths)
  combined = {}
  PORT_MERGE_GROUPS.each do |group|
    flat = BoilerplateEnvMerge.flatten_env_group_env(classification, group)
    m = BoilerplateEnvMerge.apply_env_file_overlays(flat, extra_paths)
    m = BoilerplateEnvMerge.apply_locale_next_public_sync(m, group)
    m = BoilerplateEnvMerge.apply_auth_mode_next_public_sync(m, group)
    m = BoilerplateEnvMerge.apply_info_next_public_sync(m, group)
    m = BoilerplateEnvMerge.reorder_env_map_to_group_vars(m, classification, group)
    combined.merge!(m)
  end
  combined
end

def validate_port_vars(env_map)
  REQUIRED_PORT_ENV_VARS.each do |key|
    val = env_map[key]
    if val.nil? || val.to_s.strip.empty?
      warn("Error: missing #{key} in merged remote_k8s env (classification + overrides)")
      exit 1
    end
    unless val.to_s.match?(/\A[0-9]+\z/)
      warn("Error: #{key}=#{val.inspect} must be a non-negative integer string")
      exit 1
    end
  end
end

def int_port(env_map, key)
  env_map[key].to_i
end

def patch_api_deployment(api_port, pg_port, vk_port)
  wait_pg = "until nc -z postgres #{pg_port}; do echo waiting for postgres; sleep 2; done; echo postgres ready"
  wait_vk = "until nc -z valkey #{vk_port}; do echo waiting for valkey; sleep 2; done; echo valkey ready"
  {
    'apiVersion' => 'apps/v1',
    'kind' => 'Deployment',
    'metadata' => { 'name' => 'api' },
    'spec' => {
      'template' => {
        'spec' => {
          'initContainers' => [
            {
              'name' => 'wait-postgres',
              'command' => ['sh', '-c', wait_pg]
            },
            {
              'name' => 'wait-valkey',
              'command' => ['sh', '-c', wait_vk]
            }
          ],
          'containers' => [
            {
              'name' => 'api',
              'ports' => [{ 'containerPort' => api_port }],
              'env' => [
                { 'name' => 'DB_PORT', 'value' => pg_port.to_s },
                { 'name' => 'VALKEY_PORT', 'value' => vk_port.to_s }
              ],
              'readinessProbe' => {
                'httpGet' => {
                  'path' => '/v1/health',
                  'port' => api_port
                }
              },
              'livenessProbe' => {
                'httpGet' => {
                  'path' => '/v1/health',
                  'port' => api_port
                }
              }
            }
          ]
        }
      }
    }
  }
end

def patch_service(name, port)
  {
    'apiVersion' => 'v1',
    'kind' => 'Service',
    'metadata' => { 'name' => name },
    'spec' => {
      'ports' => [
        { 'name' => 'http', 'port' => port, 'targetPort' => port }
      ]
    }
  }
end

def patch_management_api_deployment(mgmt_port, pg_port, vk_port)
  wait_pg = "until nc -z postgres #{pg_port}; do echo waiting for postgres; sleep 2; done; echo postgres ready"
  wait_vk = "until nc -z valkey #{vk_port}; do echo waiting for valkey; sleep 2; done; echo valkey ready"
  {
    'apiVersion' => 'apps/v1',
    'kind' => 'Deployment',
    'metadata' => { 'name' => 'management-api' },
    'spec' => {
      'template' => {
        'spec' => {
          'initContainers' => [
            {
              'name' => 'wait-postgres',
              'command' => ['sh', '-c', wait_pg]
            },
            {
              'name' => 'wait-valkey',
              'command' => ['sh', '-c', wait_vk]
            }
          ],
          'containers' => [
            {
              'name' => 'management-api',
              'ports' => [{ 'containerPort' => mgmt_port }],
              'env' => [
                { 'name' => 'DB_PORT', 'value' => pg_port.to_s },
                { 'name' => 'VALKEY_PORT', 'value' => vk_port.to_s }
              ],
              'readinessProbe' => {
                'httpGet' => {
                  'path' => '/v1/health',
                  'port' => mgmt_port
                }
              },
              'livenessProbe' => {
                'httpGet' => {
                  'path' => '/v1/health',
                  'port' => mgmt_port
                }
              }
            }
          ]
        }
      }
    }
  }
end

def patch_web_deployment(web_port, sidecar_port, api_port)
  wait_sidecar = "until wget -q -O /dev/null http://web-sidecar:#{sidecar_port}/; do echo waiting for web-sidecar; sleep 2; done; echo web-sidecar ready"
  {
    'apiVersion' => 'apps/v1',
    'kind' => 'Deployment',
    'metadata' => { 'name' => 'web' },
    'spec' => {
      'template' => {
        'spec' => {
          'initContainers' => [
            {
              'name' => 'wait-web-sidecar',
              'command' => ['sh', '-c', wait_sidecar]
            }
          ],
          'containers' => [
            {
              'name' => 'web',
              'ports' => [{ 'containerPort' => web_port }],
              'env' => [
                { 'name' => 'RUNTIME_CONFIG_URL', 'value' => "http://web-sidecar:#{sidecar_port}" },
                { 'name' => 'API_SERVER_BASE_URL', 'value' => "http://api:#{api_port}" }
              ],
              'readinessProbe' => {
                'tcpSocket' => { 'port' => web_port }
              },
              'livenessProbe' => {
                'tcpSocket' => { 'port' => web_port }
              }
            }
          ]
        }
      }
    }
  }
end

def patch_web_sidecar_deployment(sidecar_port, api_port)
  {
    'apiVersion' => 'apps/v1',
    'kind' => 'Deployment',
    'metadata' => { 'name' => 'web-sidecar' },
    'spec' => {
      'template' => {
        'spec' => {
          'containers' => [
            {
              'name' => 'web-sidecar',
              'ports' => [{ 'containerPort' => sidecar_port }],
              'env' => [
                { 'name' => 'API_SERVER_BASE_URL', 'value' => "http://api:#{api_port}" }
              ]
            }
          ]
        }
      }
    }
  }
end

def patch_management_web_deployment(mw_port, sidecar_port, mgmt_api_port)
  wait_sidecar = "until wget -q -O /dev/null http://management-web-sidecar:#{sidecar_port}/; do echo waiting for management-web-sidecar; sleep 2; done; echo management-web-sidecar ready"
  {
    'apiVersion' => 'apps/v1',
    'kind' => 'Deployment',
    'metadata' => { 'name' => 'management-web' },
    'spec' => {
      'template' => {
        'spec' => {
          'initContainers' => [
            {
              'name' => 'wait-management-web-sidecar',
              'command' => ['sh', '-c', wait_sidecar]
            }
          ],
          'containers' => [
            {
              'name' => 'management-web',
              'ports' => [{ 'containerPort' => mw_port }],
              'env' => [
                { 'name' => 'RUNTIME_CONFIG_URL', 'value' => "http://management-web-sidecar:#{sidecar_port}" },
                { 'name' => 'MANAGEMENT_API_SERVER_BASE_URL', 'value' => "http://management-api:#{mgmt_api_port}" }
              ],
              'readinessProbe' => {
                'tcpSocket' => { 'port' => mw_port }
              },
              'livenessProbe' => {
                'tcpSocket' => { 'port' => mw_port }
              }
            }
          ]
        }
      }
    }
  }
end

def patch_management_web_sidecar_deployment(sidecar_port)
  {
    'apiVersion' => 'apps/v1',
    'kind' => 'Deployment',
    'metadata' => { 'name' => 'management-web-sidecar' },
    'spec' => {
      'template' => {
        'spec' => {
          'containers' => [
            {
              'name' => 'management-web-sidecar',
              'ports' => [{ 'containerPort' => sidecar_port }]
            }
          ]
        }
      }
    }
  }
end

def patch_ingress(contract, env_map)
  ing = contract['ingress']
  raise 'contract: missing ingress' unless ing.is_a?(Hash)

  meta_name = ing['metadata_name'].to_s
  raise 'contract: ingress.metadata_name required' if meta_name.empty?

  rules_spec = ing['rules']
  raise 'contract: ingress.rules must be a non-empty array' unless rules_spec.is_a?(Array) && !rules_spec.empty?

  rules = rules_spec.map do |r|
    host = r['host'].to_s
    svc = r['service_name'].to_s
    var = r['port_env_var'].to_s
    raise "contract: invalid ingress rule #{r.inspect}" if host.empty? || svc.empty? || var.empty?

    p = int_port(env_map, var)
    {
      'host' => host,
      'http' => {
        'paths' => [
          {
            'path' => '/',
            'pathType' => 'Prefix',
            'backend' => {
              'service' => {
                'name' => svc,
                'port' => { 'number' => p }
              }
            }
          }
        ]
      }
    }
  end

  {
    'apiVersion' => 'networking.k8s.io/v1',
    'kind' => 'Ingress',
    'metadata' => { 'name' => meta_name },
    'spec' => {
      'rules' => rules
    }
  }
end

def write_patch_file!(path, docs)
  FileUtils.mkdir_p(File.dirname(path))
  File.write(path, YAML.dump_stream(*docs))
end

def main
  env_name, output_repo, contract_path, dry_run = parse_args(ARGV.dup)
  usage('missing --env') if env_name.nil? || env_name.empty?

  if !dry_run && (output_repo.nil? || output_repo.empty?)
    if !ENV['BOILERPLATE_K8S_OUTPUT_REPO'].to_s.empty?
      output_repo = ENV['BOILERPLATE_K8S_OUTPUT_REPO']
    else
      usage('set BOILERPLATE_K8S_OUTPUT_REPO or pass --output-repo')
    end
  end

  contract = load_contract(contract_path)
  cluster = contract['cluster'] || {}
  pg = Integer(cluster['postgres'] || 5432)
  vk = Integer(cluster['valkey'] || 6379)

  profile = ENV['BOILERPLATE_ENV_PROFILE'] || 'remote_k8s'
  classification = BoilerplateEnvMerge.merged_classification(profile)
  extras = extra_env_paths(env_name)
  env_map = merge_port_env(classification, extras)
  validate_port_vars(env_map)

  api_p = int_port(env_map, 'API_PORT')
  web_p = int_port(env_map, 'WEB_PORT')
  wsc_p = int_port(env_map, 'WEB_SIDECAR_PORT')
  mapi_p = int_port(env_map, 'MANAGEMENT_API_PORT')
  mweb_p = int_port(env_map, 'MANAGEMENT_WEB_PORT')
  mwsc_p = int_port(env_map, 'MANAGEMENT_WEB_SIDECAR_PORT')

  overlay = File.join('apps', "boilerplate-#{env_name}")

  api_docs = [
    patch_api_deployment(api_p, pg, vk),
    patch_service('api', api_p)
  ]
  web_docs = [
    patch_web_deployment(web_p, wsc_p, api_p),
    patch_web_sidecar_deployment(wsc_p, api_p),
    patch_service('web', web_p),
    patch_service('web-sidecar', wsc_p)
  ]
  mapi_docs = [
    patch_management_api_deployment(mapi_p, pg, vk),
    patch_service('management-api', mapi_p)
  ]
  mweb_docs = [
    patch_management_web_deployment(mweb_p, mwsc_p, mapi_p),
    patch_management_web_sidecar_deployment(mwsc_p),
    patch_service('management-web', mweb_p),
    patch_service('management-web-sidecar', mwsc_p)
  ]
  ingress_doc = patch_ingress(contract, env_map)

  if dry_run
    puts YAML.dump_stream(*api_docs, *web_docs, *mapi_docs, *mweb_docs, ingress_doc)
    return
  end

  root = File.expand_path(output_repo)
  write_patch_file!(File.join(root, overlay, 'api', 'deployment-ports-and-probes.yaml'), api_docs)
  write_patch_file!(File.join(root, overlay, 'web', 'deployment-ports-and-probes.yaml'), web_docs)
  write_patch_file!(File.join(root, overlay, 'management-api', 'deployment-ports-and-probes.yaml'), mapi_docs)
  write_patch_file!(File.join(root, overlay, 'management-web', 'deployment-ports-and-probes.yaml'), mweb_docs)
  ingress_path = File.join(root, overlay, 'common', 'ingress-port-backends.yaml')
  FileUtils.mkdir_p(File.dirname(ingress_path))
  File.write(ingress_path, YAML.dump(ingress_doc))

  warn "Wrote port patches under #{root}/#{overlay}/"
end

main
