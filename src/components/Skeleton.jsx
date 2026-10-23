const variantClasses = {
  rectangular: 'rounded-xl',
  circular: 'rounded-full',
  text: 'rounded-md h-4 w-full',
};

const Skeleton = ({
  className = '',
  variant = 'rectangular',
  as: Component = 'div',
  ...props
}) => {
  const baseClasses = 'animate-pulse bg-gray-200/80 dark:bg-gray-700/50';
  const variantClass = variantClasses[variant] || variantClasses.rectangular;

  return (
    <Component
      role="status"
      className={`${baseClasses} ${variantClass} ${className}`.trim()}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </Component>
  );
};

export default Skeleton;