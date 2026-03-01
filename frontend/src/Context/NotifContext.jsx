import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import api from "../Utils/api";

const NotifContext = createContext(null);

export function NotifProvider({ children }) {
    const [notificationPreview, setNotificationPreview] = useState([]);
    const [notification, setNotification] = useState([]);
    const [pageTitle, setPageTitle] = useState("");

    // Prevent duplicate calls in React 18 dev
    const fetchedRef = useRef(false);

    const getNotif = async () => {
        try {
            const res = await api.get("/api/realtime/notif/");
            const data = res.data || {};

            setNotification(data.notif || []);
            setNotificationPreview(data.notif_preview || []);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };


    const markNotificationAsRead = (notifId) => {
        if (!notifId) return;

        // Mark the notification as read in the main list
        setNotification(prev =>
            prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
        );

        // Remove it from the preview (only unread notifications)
        setNotificationPreview(prev =>
            prev.filter(n => n.id !== notifId)
        );
    };





    // Run ONCE per app load
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        getNotif();
    }, []);

    const DEFAULT_TITLE = "CSSS IT Club";

    useEffect(() => {
        const baseTitle = pageTitle || DEFAULT_TITLE;

        document.title =
            notificationPreview.length > 0
                ? `(${notificationPreview.length}) ${baseTitle}`
                : baseTitle;
    }, [notificationPreview.length, pageTitle]);

    const updatePageTitle = (title) => {
        setPageTitle(title)
    }



    const addNotifications = (newItems = []) => {
        setNotificationPreview((prev) => [...newItems, ...prev]);
        setNotification((prev) => [...newItems, ...prev]);
    };

    const makeAllAsRead = () => {
        setNotification(prev => prev.map(n => ({ ...n, is_read: true })));
        setNotificationPreview([])
    }

    return (
        <NotifContext.Provider
            value={{
                notificationPreview,
                notification,
                makeAllAsRead,
                addNotifications,
                updatePageTitle,
                markNotificationAsRead,
                getNotif,
            }}
        >
            {children}
        </NotifContext.Provider>
    );
}

export function useNotifContext() {
    const context = useContext(NotifContext);
    if (!context) {
        throw new Error("useNotifContext must be used inside NotifProvider");
    }
    return context;
}
