-- 0000 migration: domains for management_user_credentials and management_user_bio (lengths align with @metaboost/helpers)

CREATE DOMAIN varchar_password AS VARCHAR(60);
CREATE DOMAIN varchar_short AS VARCHAR(50);
CREATE DOMAIN server_time_with_default AS TIMESTAMP DEFAULT NOW();
