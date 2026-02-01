# config/agent.hcl

exit_after_auth = false
pid_file = "/secrets/vault-agent.pid"

auto_auth {
  method "approle" {
    config = {
      role_id_file_path   = "/vault/file/role_id.txt"
      secret_id_file_path = "/vault/file/secret_id.txt"
      remove_secret_id_file_after_reading=true
    }
  }

  sink "file" {
    config = {
      path = "/secrets/.agent-token"
    }
  }
}

# Separate credential

template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/api/app.env"
  perms       = "0640"
}

template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/auth_api/app.env"
  perms       = "0640"
}

template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/user_api/app.env"
  perms       = "0640"
}

template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/sqlite_db/app.env"
  perms       = "0640"

}

template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/quiz_api/app.env"
  perms       = "0640"

}

template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/front/app.env"
  perms       = "0640"

}
template {
  source      = "/vault/templates/app.env.tpl"
  destination = "/secrets/nginx/app.env"
  perms       = "0640"

}