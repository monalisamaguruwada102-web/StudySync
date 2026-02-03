import React, { useState, useEffect } from 'react';

// Assets
import bg1 from '../../assets/images/login-bg-1.png';
import bg2 from '../../assets/images/login-bg-2.png';
import bg3 from '../../assets/images/login-bg-3.jpg';

const BackgroundSlideshow = () => {
    const [bgIndex, setBgIndex] = useState(0);
    const backgrounds = [bg1, bg2, bg3];

    // Background Slideshow
    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % backgrounds.length);
        }, 5000); // Change image every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            {backgrounds.map((bg, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${index === bgIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{ backgroundImage: `url(${bg})` }}
                />
            ))}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
    );
};

export default BackgroundSlideshow;
