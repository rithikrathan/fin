import PredictionsContent from '../components/predictions/PredictionsContent';

export default function PredictionsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-txt-primary">Predictions</h1>
      <PredictionsContent idPrefix="page" />
    </div>
  );
}
