import { createContext, useContext, useState, useEffect } from "react";
import api from "../Utils/api";

const SiteContext = createContext();

const SiteProvider = ({ children }) => {
    const [site, setSite] = useState({
        brandName: "CSSS IT Club",
        isTwoFaMandatory: false,
    });

    const getSiteInfo = async () => {
        try {
            const res = await api.get("/api/site/");
            if (res.status === 200 && res.data) {
                const site = res.data;
                setSite({
                    brandName: site.brand_name,
                    isTwoFaMandatory: site.is_two_fa_mandatory,
                });
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        // getSiteInfo();
    }, []);

    return (
        <SiteContext.Provider value={{ site }}>
            {children}
        </SiteContext.Provider>
    );
};

export default SiteProvider;

export function useSite() {
    return useContext(SiteContext);
}
