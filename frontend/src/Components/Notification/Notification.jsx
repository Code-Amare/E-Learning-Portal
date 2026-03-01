import { useEffect, useRef } from "react";
import { neonToast } from "../../Components/NeonToast/NeonToast";
import { useUser } from "../../Context/UserContext";
import { useNotifContext } from "../../Context/NotifContext"

const WS_URL = import.meta.env.VITE_WS_URL;

export default function Notification() {
    const { user, loading } = useUser();
    const { addNotifications } = useNotifContext();

    const wsRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const retryCountRef = useRef(0);

    const connect = () => {
        if (!user?.id || wsRef.current) return;

        const baseUrl = WS_URL.endsWith("/") ? WS_URL : `${WS_URL}/`;
        const url = `${baseUrl}notification/`;

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            retryCountRef.current = 0;
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            const notification_ws = () => {
                const notif = {
                    "id": data.id,
                    "title": data.title,
                    "description": data.message,
                    "actor_id": data?.actor_id,
                    "url": data?.url,
                    "is_read": data?.is_read,
                    "code": data?.code,
                    "sent_at": data?.sent_at,
                    "actor": data?.actor,
                }
                addNotifications([notif])
                switch (data.code) {
                    case "success":
                        neonToast.success(data.message);
                        break;
                    case "error":
                        neonToast.error(data.message);
                        break;
                    case "warning":
                        neonToast.warning(data.message);
                        break;
                    default:
                        neonToast.info(data.message);
                }

                if (data.is_push_notif && "Notification" in window) {
                    if (window.Notification.permission === "granted") {
                        new window.Notification(data.title || "Notification", {
                            body: data.message,
                        });
                    } else if (window.Notification.permission !== "denied") {
                        window.Notification.requestPermission().then((permission) => {
                            if (permission === "granted") {
                                new window.Notification(data.title || "Notification", {
                                    body: data.message,
                                });
                            }
                        });
                    }
                }
            }

            if (data?.live_update) {

            } else {
                notification_ws()
            }

        };

        ws.onerror = () => {
            ws.close();
        };

        ws.onclose = () => {
            wsRef.current = null;

            if (!user?.id) return;

            const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
            retryCountRef.current += 1;

            retryTimeoutRef.current = setTimeout(connect, delay);
        };
    };

    useEffect(() => {
        if (loading || !user?.id) return;

        connect();

        return () => {
            clearTimeout(retryTimeoutRef.current);
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [user?.id, loading]);

    return null;
}
