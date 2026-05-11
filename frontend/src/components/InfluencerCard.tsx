import { useNavigate } from "react-router-dom";

type InfluencerCardProps = {
  id: string;
  name: string;
  image: string;
  niche: string;
  location: string;
  followers: string;
  engagement: string;
  trustScore: number;
};

function InfluencerCard({
  id,
  name,
  image,
  niche,
  location,
  followers,
  engagement,
  trustScore,
}: InfluencerCardProps) {
  const navigate = useNavigate();

  return (
    <div className="influencer-card">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={image}
          alt={name}
          className="w-14 h-14 rounded-full object-cover bg-gray-100"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff`;
          }}
        />
        <div>
          <div className="flex items-center">
            <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
            <img
              src="/src/assets/blue-tick.svg"
              alt="Logo"
              width={17}
              height={17}
            />
          </div>
          <div className="text-sm text-gray-500">{niche}</div>
        </div>
      </div>

      <div className="info-row">
        <img src="/src/assets/map-pin.svg" alt="Logo" width={16} height={16} />
        {location}
      </div>

      <div className="info-row">
        <img src="/src/assets/users.svg" alt="Logo" width={16} height={16} />
        {followers} followers
      </div>

      <div className="info-row">
        <img src="/src/assets/heart.svg" alt="Logo" width={16} height={16} />
        {engagement} engagement
      </div>

      <div className="trust-score-row">
        <span className="text-gray-500">Trust Score</span>
        <div className="flex items-center gap-1 font-bold text-gray-900">
          <span className="text-yellow-400">★</span>
          {trustScore}/100
        </div>
      </div>

      <div className="flex gap-3 mt-auto">
        <button className="btn-card-view" onClick={() => navigate(`/influencer/${id}`)}>View Profile</button>
        <button className="btn-card-contact">Contact</button>
      </div>
    </div>
  );
}

export default InfluencerCard;
