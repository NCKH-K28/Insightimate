type PlanUpdateInput = {
  title?: string;
  sources?: string[];
};

const InfoSettings = () => {
  return <div>Info Settings Component</div>;
};

const ScenariosSettings = () => {
  return <div>Scenarios Settings Component</div>;
};

export default function SettingsPage() {
  return (
    <div>
      <InfoSettings />
      <ScenariosSettings />
    </div>
  );
}
