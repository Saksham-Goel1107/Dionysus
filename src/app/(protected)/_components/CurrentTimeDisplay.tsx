"use client"
import React, { useEffect, useState } from "react";

const pad = (n: number) => n.toString().padStart(2, "0");

function getFormattedDateTime() {
    const now = new Date();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const date = now.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    return {
        time: `${hours}:${minutes}:${seconds}`,
        date,
    };
}

export default function CurrentTimeDisplay() {
    const [{ time, date }, setDateTime] = useState(getFormattedDateTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setDateTime(getFormattedDateTime());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="current-time-container">
            <div className="time" key={time}>
                {time.split("").map((char, i) => (
                    <span className="digit" key={i}>
                        {char}
                    </span>
                ))}
            </div>
            <div className="date">{date}</div>
            <style jsx>{`
                .current-time-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: linear-gradient(90deg, #232526 0%, #414345 100%);
                    padding: 3px 4px;
                    border-radius: 0.5rem;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
                    color: #fff;
                    font-family: 'JetBrains Mono', 'Fira Mono', 'Menlo', monospace;
                    min-width: 60px;
                }
                .time {
                    font-size: 1rem;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    display: flex;
                    gap: 0.05em;
                    margin-bottom: 0.15rem;
                    transition: color 0.3s;
                }
                .digit {
                    display: inline-block;
                    animation: pop 0.4s ease;
                }
                .date {
                    font-size: 0.6rem;
                    font-weight: 400;
                    opacity: 0.75;
                    letter-spacing: 0.03em;
                    text-align: center;
                }
                @keyframes pop {
                    0% { transform: scale(1.15) translateY(-5%); opacity: 0.7; }
                    60% { transform: scale(0.95) translateY(1%); opacity: 1; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
