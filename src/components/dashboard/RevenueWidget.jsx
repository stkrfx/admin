import { DollarSign, AlertCircle, TrendingUp, CheckCircle, ArrowDownLeft } from 'lucide-react';

export default function RevenueWidget({ data }) {
  // data is passed from the server action
  const { unsettled, refunds, revenue } = data || { 
    unsettled: { total: 0, breakdown: {} },
    refunds: { totalRefundable: 0, cancellationFees: 0 },
    revenue: { lastYearGross: 0 }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      
      {/* CARD 1: Unsettled Funds (The "Holding" Account) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Settlement</h3>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ${unsettled.total?.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Funds currently held</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign size={20} />
          </div>
        </div>
        
        {/* Breakdown Mini-Table */}
        <div className="space-y-2 border-t border-slate-50 pt-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Experts Share</span>
            <span className="font-medium">${unsettled.breakdown?.expert?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Org Commission</span>
            <span className="font-medium">${unsettled.breakdown?.org?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Tax</span>
            <span className="font-medium">${unsettled.breakdown?.tax?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs bg-slate-50 p-1 rounded">
            <span className="text-slate-900 font-bold">Admin Net</span>
            <span className="text-green-600 font-bold">+${unsettled.breakdown?.adminNet?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* CARD 2: Refunds & Cancellations */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Refund Action Required</h3>
            <div className="text-2xl font-bold text-red-600 mt-1">
              ${refunds.totalRefundable?.toLocaleString()}
            </div>
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> Needs Authorization
            </p>
          </div>
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <ArrowDownLeft size={20} />
          </div>
        </div>

        <div className="mt-auto bg-slate-50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500">Cancellation Fees Earned</span>
            <span className="text-xs font-bold text-green-600">+${refunds.cancellationFees?.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-red-500 h-full w-[70%]"></div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Net to refund after charges applied.
          </div>
        </div>
      </div>

      {/* CARD 3: Gross Revenue (Total Incoming) */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <TrendingUp size={80} />
        </div>
        
        <div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Last Year Revenue</h3>
          <div className="text-3xl font-bold mt-1">
            ${revenue.lastYearGross?.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
              +{revenue.growth}%
            </span>
            <span className="text-slate-500 text-xs">YOY Growth</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle size={14} className="text-green-500" />
            <span>Net Incoming (Experts + Org + Tax + Admin)</span>
          </div>
        </div>
      </div>

    </div>
  );
}