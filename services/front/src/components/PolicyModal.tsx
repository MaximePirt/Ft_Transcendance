import { useTranslation } from 'react-i18next'
import { privacyContent, termsContent } from '../content/policies'

interface PolicyModalProps {
  policy: 'privacy' | 'terms'
  onClose: () => void
}

function PolicyModal({ policy, onClose }: PolicyModalProps) {
  const { t } = useTranslation()

  return (
    <div className="login-overlay" role="dialog" aria-modal="true">
      <div className="login-card">
        <div className="login-card__head">
          <div>
            <p className="eyebrow small">
              {policy === 'privacy' ? t("privacy_policy") : t("terms")}
            </p>
            <h2>{policy === 'privacy' ? t("privacy_policy") : t("terms")}</h2>
          </div>
          <button className="close" aria-label="Fermer" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="policy-content">
          {policy === 'privacy' ? privacyContent : termsContent}
        </div>
      </div>
    </div>
  )
}

export default PolicyModal
