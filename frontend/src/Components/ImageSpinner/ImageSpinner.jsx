import React, { useState } from "react";
import styles from "./ImageSpinner.module.css";

function ImageSpinner({ src, alt }) {
    const [loading, setLoading] = useState(true);

    return (
        <div className={styles.loaderContainer}>
            {loading && (

                <div className={styles.loader}></div>
            )}
            <img
                src={src}
                alt={alt}
                style={{ display: loading ? "none" : "block", width: "100%", height: "100%" }}
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
            />
        </div>
    );
}

export default ImageSpinner;
