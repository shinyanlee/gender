import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, LogOut } from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDwGPjTtIVuiq1aGVmxTqxLjAelgGTwML8",
  authDomain: "gender-reveal-app-a7d11.firebaseapp.com",
  projectId: "gender-reveal-app-a7d11",
  storageBucket: "gender-reveal-app-a7d11.firebasestorage.app",
  messagingSenderId: "649675805756",
  appId: "1:649675805756:web:cb7c4a55e5a18487ae9f39"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [currentUser, setCurrentUser] = useState('');
  const [inputName, setInputName] = useState('');
  const [amount, setAmount] = useState('');
  const [stickers, setStickers] = useState([]);
  const [allBets, setAllBets] = useState([]);

  useEffect(() => {
    const betsRef = collection(db, 'bets');
    
    const unsubscribeDb = onSnapshot(betsRef, 
      (snapshot) => {
        const betsData = [];
        snapshot.forEach((doc) => {
          betsData.push({ id: doc.id, ...doc.data() });
        });
        betsData.sort((a, b) => b.timestamp - a.timestamp);
        setAllBets(betsData);
      },
      (error) => console.error("讀取資料庫失敗:", error)
    );

    return () => unsubscribeDb();
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem('genderReveal_userName');
    if (savedName) setCurrentUser(savedName);
  }, []);

  const myBet = allBets.find(bet => bet.name === currentUser);
  const totalAmount = allBets.reduce((sum, bet) => sum + Number(bet.amount), 0);
  const boyAmount = allBets.filter(b => b.gender === 'boy').reduce((sum, bet) => sum + Number(bet.amount), 0);
  const girlAmount = allBets.filter(b => b.gender === 'girl').reduce((sum, bet) => sum + Number(bet.amount), 0);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    
    if (allBets.some(bet => bet.name === inputName.trim())) {
      const confirmLogin = window.confirm(`"${inputName.trim()}" 已經有人使用且下注了。這是你本人嗎？`);
      if (!confirmLogin) return;
    }

    setCurrentUser(inputName.trim());
    localStorage.setItem('genderReveal_userName', inputName.trim());
  };

  const handleLogout = () => {
    setCurrentUser('');
    setInputName('');
    localStorage.removeItem('genderReveal_userName');
  };

  const handleVote = async (gender, e) => {
    if (!amount || Number(amount) <= 0) {
      alert('請輸入有效的下注金額');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const newSticker = { id: Date.now(), gender: gender, x: rect.left + rect.width / 2 - 25, y: rect.top };
    setStickers(prev => [...prev, newSticker]);
    setTimeout(() => {
      setStickers(prev => prev.filter(s => s.id !== newSticker.id));
    }, 1000);

    try {
      const docRef = doc(db, 'bets', currentUser);
      await setDoc(docRef, {
        name: currentUser,
        gender: gender,
        amount: Number(amount),
        timestamp: Date.now()
      });
      setAmount('');
    } catch (error) {
      console.error("寫入失敗:", error);
      alert("寫入失敗，請重試");
    }
  };

  const handleDeleteBet = async () => {
    try {
      const docRef = doc(db, 'bets', currentUser);
      await deleteDoc(docRef);
    } catch (error) {
       console.error("刪除失敗:", error);
    }
  };

  const handleEditBet = () => {
    if (myBet) {
      setAmount(myBet.amount.toString());
      handleDeleteBet();
    }
  };

  // 登入畫面
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4 font-sans text-amber-950">
        <div className="bg-white p-8 rounded-[2rem] border-4 border-amber-200 shadow-xl w-full max-w-md text-center">
          <h1 className="text-3xl font-black mb-6 tracking-wide text-amber-800">
            寶寶性別預測
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="text"
              placeholder="請輸入姓名或暱稱"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-lg font-bold text-center text-amber-900 placeholder-amber-400 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
              required
            />
            <button 
              type="submit" 
              className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl text-xl border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all"
            >
              進入活動
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 主畫面
  return (
    <div className="min-h-screen bg-amber-50 p-4 md:p-8 font-sans text-amber-950 relative overflow-hidden">
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 1; }
          100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
        }
        .animate-float {
          animation: floatUp 1s ease-out forwards;
          pointer-events: none;
          position: fixed;
          z-index: 50;
        }
      `}</style>

      {stickers.map((sticker) => (
        <div key={sticker.id} className="animate-float text-4xl" style={{ left: sticker.x, top: sticker.y }}>
          {sticker.gender === 'boy' ? '👦🏻' : '👧🏻'}
        </div>
      ))}

      <div className="max-w-5xl mx-auto">
        {/* 頂部導覽 */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-3xl border-4 border-amber-200 shadow-sm">
          <h1 className="text-xl md:text-2xl font-black text-amber-800 flex items-center gap-2">
            Hi, {currentUser}
          </h1>
          <button onClick={handleLogout} className="text-amber-600 hover:text-red-500 flex items-center gap-1 font-bold bg-amber-50 px-3 py-2 rounded-xl transition-colors">
            <LogOut size={18} strokeWidth={3} /> <span className="text-sm">登出</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            
            {/* 總金額區塊 */}
            <div className="bg-white p-6 rounded-[2rem] border-4 border-amber-200 shadow-sm text-center">
              <h2 className="text-amber-700 font-bold mb-2">目前累積總獎金</h2>
              <div className="text-4xl md:text-5xl font-black text-red-500 mb-6 drop-shadow-sm">
                $ {totalAmount.toLocaleString()}
              </div>
              
              <div className="flex h-6 rounded-full overflow-hidden bg-amber-100 border-2 border-amber-200 p-1 gap-1">
                <div style={{ width: `${totalAmount ? (boyAmount/totalAmount)*100 : 50}%` }} className="bg-sky-400 rounded-full transition-all duration-700 shadow-sm"></div>
                <div style={{ width: `${totalAmount ? (girlAmount/totalAmount)*100 : 50}%` }} className="bg-rose-400 rounded-full transition-all duration-700 shadow-sm"></div>
              </div>
              <div className="flex justify-between mt-3 text-sm font-black">
                <span className="text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border-2 border-sky-100">男生 ${boyAmount.toLocaleString()}</span>
                <span className="text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border-2 border-rose-100">女生 ${girlAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* 下注操作區塊 */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border-4 border-amber-200 shadow-sm">
              {!myBet ? (
                <div className="space-y-5">
                  <h3 className="text-xl font-black text-amber-800 mb-4 text-center">預測性別</h3>
                  <input
                    type="number"
                    placeholder="請輸入下注金額"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-xl font-bold text-center text-amber-900 placeholder-amber-400 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
                  />
                  <div className="flex gap-4 pt-2">
                    <button onClick={(e) => handleVote('boy', e)} className="flex-1 bg-sky-100 text-sky-800 border-4 border-sky-300 font-black py-5 rounded-[2rem] text-xl flex flex-col items-center justify-center border-b-8 active:border-b-4 active:translate-y-1 transition-all">
                      <span className="text-4xl mb-2 drop-shadow-sm">👦🏻</span> 男生
                    </button>
                    <button onClick={(e) => handleVote('girl', e)} className="flex-1 bg-rose-100 text-rose-800 border-4 border-rose-300 font-black py-5 rounded-[2rem] text-xl flex flex-col items-center justify-center border-b-8 active:border-b-4 active:translate-y-1 transition-all">
                      <span className="text-4xl mb-2 drop-shadow-sm">👧🏻</span> 女生
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <h3 className="text-amber-700 font-bold mb-4 text-lg">你的預測結果</h3>
                  <div className={`inline-block px-8 py-4 rounded-[2rem] text-2xl font-black mb-8 border-4 shadow-sm ${myBet.gender === 'boy' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                    {myBet.gender === 'boy' ? '👦🏻 男生' : '👧🏻 女生'} <br/> 
                    <span className="text-3xl mt-2 block">${myBet.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button onClick={handleEditBet} className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-amber-100 text-amber-800 border-2 border-amber-200 rounded-2xl hover:bg-amber-200 font-bold active:scale-95 transition-all">
                      <Edit2 size={20} strokeWidth={3} /> 修改金額
                    </button>
                    <button onClick={handleDeleteBet} className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-red-100 text-red-600 border-2 border-red-200 rounded-2xl hover:bg-red-200 font-bold active:scale-95 transition-all">
                      <Trash2 size={20} strokeWidth={3} /> 重新下注
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 英雄榜 */}
          <div className="w-full md:w-1/3 bg-white p-6 rounded-[2rem] border-4 border-amber-200 shadow-sm h-fit">
            <h3 className="text-xl font-black text-amber-800 mb-5 flex items-center gap-2 pb-3 border-b-4 border-amber-100">
              英雄榜
            </h3>
            <div className="space-y-3">
              {allBets.length === 0 ? (
                <p className="text-amber-500 font-bold text-center py-8 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200">
                  目前還沒有紀錄
                </p>
              ) : (
                allBets.map(bet => (
                  <div key={bet.name} className="flex justify-between items-center p-3 px-4 rounded-2xl bg-amber-50 border-2 border-amber-200 transition-transform hover:scale-105">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow-sm">{bet.gender === 'boy' ? '👦🏻' : '👧🏻'}</span>
                      <span className="font-black text-amber-900">{bet.name}</span>
                    </div>
                    <span className={`font-black text-lg ${bet.gender === 'boy' ? 'text-sky-600' : 'text-rose-600'}`}>
                      ${bet.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}