interface Props {
  size?: "sm" | "md";
}

const LoadingSpinner = ({ size = "md" }: Props) => {
  const dimension = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return <span className={`inline-block ${dimension} animate-spin rounded-full border-2 border-indigo-600 border-t-transparent`} />;
};

export default LoadingSpinner;
