import React from 'react';
import styles from './Drawer.module.css';

export default function Drawer() {
    return (
        <>
            <div className={styles.overlay}></div>
            <div className={styles.drawer}>
                <div className={styles.header}>
                    <h2>User Preferences</h2>
                    <button className={styles.addBtn}>Add Priority</button>
                    <button className={styles.closeBtn}>×</button>
                </div>
                <div className={styles.body}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Id</th>
                                <th style={{ width: '40%' }}>Setting Name</th>
                                <th>Value</th>
                                <th>Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={styles.filterRow}>
                                <td></td>
                                <td><input type="text" /></td>
                                <td><input type="text" /></td>
                                <td><input type="text" /></td>
                                <td><input type="text" /></td>
                            </tr>
                            {[
                                { id: 1, name: 'PREFERRED_SPECIES', value: 'Tuna, Mackerel', type: 'Fishing' },
                                { id: 2, name: 'HOME_PORT', value: 'Port 1 (South Pier)', type: 'General' },
                                { id: 4, name: 'MAX_WAVE_WARNING', value: '2.5m', type: 'Safety' },
                                { id: 5, name: 'WEATHER_ALERT_FREQ', value: 'Hourly', type: 'Alerts' },
                                { id: 6, name: 'AUTO_SAVE_ROUTE', value: 'true', type: 'Navigation' },
                                { id: 7, name: 'LINE_NOTIFICATION', value: 'true', type: 'Alerts' },
                                { id: 8, name: 'DATA_SAVING_MODE', value: 'false', type: 'General' },
                            ].map(row => (
                                <tr key={row.id}>
                                    <td>
                                        <button className={styles.actionBtn}>⚙ ▾</button>
                                    </td>
                                    <td>{row.id}</td>
                                    <td>{row.name}</td>
                                    <td style={{ color: '#555' }}>{row.value}</td>
                                    <td>{row.type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
