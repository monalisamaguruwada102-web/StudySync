import { useState, useEffect } from "react";

export const useFirestore = (serviceMethod, ...args) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            await serviceMethod(...args, (items) => {
                setData(items);
                setLoading(false);
            });
        } catch (err) {
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleUpdate = () => {
            fetchData();
        };

        window.addEventListener('study-sync-update', handleUpdate);

        const unsubscribe = serviceMethod(...args, (items) => {
            setData(items);
            setLoading(false);
        });

        return () => {
            window.removeEventListener('study-sync-update', handleUpdate);
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [serviceMethod, JSON.stringify(args)]);

    return { data, loading, error, refresh: fetchData };
};
