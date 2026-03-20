import { useTranslation } from 'react-i18next'
import policiesEn from '../i18n/locales/en/policies.json'
import policiesFr from '../i18n/locales/fr/policies.json'
import policiesAr from '../i18n/locales/ar/policies.json'

const policiesMap: Record<string, any> = {
  en: policiesEn,
  fr: policiesFr,
  ar: policiesAr,
}

const PolicySection = ({ title, content, items }: { title?: string; content?: string; items?: string[] }) => {
  return (
    <div>
      {title && <h4>{title}</h4>}
      {content && <p>{content}</p>}
      {items && (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const PrivacyPolicyComponent = () => {
  const { i18n } = useTranslation()
  const policies = policiesMap[i18n.language] || policiesMap.en
  const privacy = policies.privacy

  return (
    <div>
      <h3>{privacy.title}</h3>
      <p>{privacy.intro}</p>
      <PolicySection title={privacy.section1.title} content={privacy.section1.content} />
      <PolicySection
        title={privacy.section2.title}
        content={privacy.section2.intro}
        items={privacy.section2.items}
      />
      <PolicySection
        title={privacy.section3.title}
        content={privacy.section3.intro}
        items={privacy.section3.items}
      />
      <PolicySection title={privacy.section4.title} content={privacy.section4.content} />
      <PolicySection title={privacy.section5.title} content={privacy.section5.content} />
      <PolicySection title={privacy.section6.title} content={privacy.section6.intro} items={privacy.section6.items}/>
    </div>
  )
}

export const TermsOfUseComponent = () => {
  const { i18n } = useTranslation()
  const policies = policiesMap[i18n.language] || policiesMap.en
  const terms = policies.terms

  return (
    <div>
      <h3>{terms.title}</h3>
      <p>{terms.intro}</p>
      <PolicySection title={terms.section1.title} content={terms.section1.content} />
      <PolicySection title={terms.section2.title} content={terms.section2.intro} items={terms.section2.items} />
      <PolicySection title={terms.section3.title} content={terms.section3.intro} items={terms.section3.items}/>
      <PolicySection title={terms.section4.title} content={terms.section4.content} />
    </div>
  )
}

export const privacyContent = <PrivacyPolicyComponent />
export const termsContent = <TermsOfUseComponent />

export default null
