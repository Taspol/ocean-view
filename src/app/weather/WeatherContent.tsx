import React from "react";
import styles from "../page.module.css";
import WeatherForecast from "@/components/WeatherForecast";

export const metadata = {
    title: "Weather Forecast | OceanNav",
};

export default function WeatherContent() {
    return (
        <>
            <div className={styles.configHeader}>
                <h2>Weather Forecast</h2>
                <p>7-day prediction models for safe maritime operations.</p>
            </div>

            <WeatherForecast />
        </>
    );
}
