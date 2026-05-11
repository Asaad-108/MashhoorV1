import "../App.css";
type CampaignCardProps = {
  title: string;
  status: string;
  influencers: number;
  budget: string;
  progress: number;
};
function CampaignCard({
  title,
  status,
  influencers,
  budget,
  progress,
}: CampaignCardProps) {
  return (
    <>
      <div className="campaign-card w-4xl">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <span className="status-badge">{status}</span>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <span className="meta-text">{influencers} influencers</span>
          <span className="meta-text">{budget} budget</span>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="text-gray-900 font-medium">{progress}%</span>
          </div>
          <div className="progress-container">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-action-outline">
            <img src="/src/assets/eye.svg" alt="View" width={16} height={16} />
            View Details
          </button>

          <button className="btn-action-outline">
            <img
              src="/src/assets/square-pen.svg"
              alt="Edit"
              width={16}
              height={16}
            />
            Edit
          </button>

          <button className="btn-action-outline">Analytics</button>
        </div>
      </div>
    </>
  );
}
export default CampaignCard;
