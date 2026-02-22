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
    }

    useEffect(() => {
        document.body.dir = i18n.dir()
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