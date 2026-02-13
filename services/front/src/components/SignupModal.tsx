import { useTranslation } from 'react-i18next'

interface SignupModalProps {
  onClose: () => void
}

function SignupModal({ onClose }: SignupModalProps) {
  const { t } = useTranslation()

  return (
    <div className="login-overlay" role="dialog" aria-modal="true">
      <div className="login-card">
        <div className="login-card__head">
          <div>
            <p className="eyebrow small">{t("signup_title")}</p>
            <h2>{t("signup_subtitle")}</h2>
          </div>
          <button className="close" aria-label={t("close")} onClick={onClose}>
            ×
          </button>
        </div>
        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault()
            onClose()
          }}
        >
          <label className="field">
            <span>{t("email")}</span>
            <input type="email" placeholder={t("email_placeholder")} required />
          </label>
          <label className="field">
            <span>{t("username")}</span>
            <input type="text" placeholder={t("username_placeholder")} required />
          </label>
          <label className="field">
            <span>{t("password")}</span>
            <input type="password" placeholder={t("password_placeholder")} required />
          </label>
          <label className="field">
            <span>{t("confirm_password")}</span>
            <input type="password" placeholder={t("password_placeholder")} required />
          </label>
          <button type="submit" className="btn primary full">
            {t("signup_button")}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SignupModal
