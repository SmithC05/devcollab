export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`w-full max-w-[1440px] mx-auto pt-[28px] pb-24 px-[32px] box-border ${className}`}>
      {children}
    </div>
  );
}
