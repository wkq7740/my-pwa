import { TxHistory } from "./components/TxHistory";

export default function Home() {
  return (
    <div className="p-5 md:flex md:flex-col md:items-center">
      <TxHistory />
    </div>
  );
}
