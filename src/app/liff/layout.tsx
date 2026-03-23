export default function LIFFLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
            {children}
        </div>
    );
}
