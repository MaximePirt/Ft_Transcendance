import { useEffect } from "react";
import { useTranslation } from "react-i18next"

const languages = [
    {code: "fr", lang: "Français"},
    {code: "en", lang: "English"},
    {code: "ar", lang: "العربية"},
]

const LanguageSelector = () => {
    const {i18n} = useTranslation();

    const changeLng = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
    }

    useEffect(() => {
        document.documentElement.dir = i18n.dir()
        document.documentElement.lang = i18n.language
    }, [i18n, i18n.language])

    return (
        <div className="btn-lng-select">
            {languages.map((lng) => {
                return <button key={lng.code} onClick={() => changeLng(lng.code)}>{lng.lang}</button>;
            })}
        </div>
    )
}

export default LanguageSelector;