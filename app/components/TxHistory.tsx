"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getShortAddress } from "../commonUtils";

export interface TransactionItem {
  txid: string;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
}

export const TxHistory = () => {
  const [txs, setTxs] = useState<TransactionItem[]>([]);

  const getBitcoinTxHistory = async () => {
    try {
      // Get bitcoin tx history from api
      const response = await fetch(
        "https://btcscan.org/api/address/bc1qxhmdufsvnuaaaer4ynz88fspdsxq2h9e9cetdj/txs"
      );
      const data = await response.json();
      const first10Txs: TransactionItem[] = data.slice(0, 10);
      setTxs(first10Txs);
      // console.log(data);
    } catch (err) {}
  };

  useEffect(() => {
    getBitcoinTxHistory();

    async function registerPeriodicSync() {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ("periodicSync" in registration) {
          console.log("registration", registration);
          await (registration as any).periodicSync.register("update-txs", {
            minInterval: 10000, // 10s
          });
        }
      } catch (error) {
        console.error("Periodic sync registration failed:", error);
      }
    }

    registerPeriodicSync();

    return () => {
      navigator.serviceWorker.ready.then((registration) => {
        if ("periodicSync" in registration) {
          (registration as any).periodicSync.unregister("update-txs");
        }
      });
    };
  }, []);

  return (
    <div className="">
      <div className="text-2xl font-bold">
        Latest Txs for{" "}
        {getShortAddress("bc1qxhmdufsvnuaaaer4ynz88fspdsxq2h9e9cetdj", 10)}
      </div>

      <div className="mt-5 flex flex-col items-stretch gap-2">
        {txs.map((tx) => (
          <div
            key={tx.txid}
            className="px-4 py-3 flex justify-between border border-white/50 rounded-md"
          >
            <Link
              href={`https://btcscan.org/tx/${tx.txid}`}
              target="_blank"
              className="text-blue-500"
            >
              {getShortAddress(tx.txid, 10)}
            </Link>

            <div>{tx.status.confirmed ? "Confirmed" : "Pending"}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
