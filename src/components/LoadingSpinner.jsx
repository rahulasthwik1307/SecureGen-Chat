import { SyncLoader } from "react-spinners";

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <SyncLoader
        color={"chocolate"}
        loading={true}
        size={10}
        aria-label="Loading Spinner"
      />
    </div>
  );
};

export default LoadingSpinner;