import React, { createContext, useState } from "react";

export const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [globalLoading, setGlobalLoading] = useState(false);
    const [componentLoadingMap, setComponentLoadingMap] = useState({});

    const setComponentLoading = (id, value) => {
        setComponentLoadingMap(prev => ({ ...prev, [id]: value }));
    };

    const isComponentLoading = (id) => !!componentLoadingMap[id];

    return (
        <LoadingContext.Provider value={{
            globalLoading,
            setGlobalLoading,
            setComponentLoading,
            isComponentLoading
        }}>
            {children}
        </LoadingContext.Provider>
    );
};
