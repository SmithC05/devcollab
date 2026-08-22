export default function PageContainer({ children, className = '' }) {
  return (
    <div 
      className={`w-[92%] md:w-[90%] lg:w-[85%] max-w-[1440px] px-6 md:px-10 pt-12 pb-20 box-border ${className}`}
      style={{ margin: '0 auto' }}
    >
      {children}
    </div>
  );
}
