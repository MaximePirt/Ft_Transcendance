import { useTranslation } from "react-i18next"

const languages = [
    {code: "fr", lang: "FRENCH"},
    {code: "en", lang: "ENGLISH"},
]

const LanguageSelector = () => {
    const {i18n} = useTranslation();

    const changeLng = (lang: string) => {
        i18n.changeLanguage(lang);
    }

    return (
        <div className="btn-lng-select">
            {languages.map((lng) => {
                return <button key={lng.code} onClick={() => changeLng(lng.code)}>{lng.lang}</button>;
            })}
        </div>
    )
}

export default LanguageSelector;