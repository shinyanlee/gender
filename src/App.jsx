import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, LogOut, AlertCircle } from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';

const boyImg = "boy.png";
const girlImg = "girl.png";

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
  const [loginError, setLoginError] = useState('');
  const [voteError, setVoteError] = useState('');
  const [forceLogin, setForceLogin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(Date.now());
  const CLOSE_TIME = new Date('2026-04-25T17:00:00+08:00').getTime();
  const isClosed = now >= CLOSE_TIME;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdown = () => {
    const diff = CLOSE_TIME - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  };

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

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
  const boyCount = allBets.filter(b => b.gender === 'boy').length;
  const girlCount = allBets.filter(b => b.gender === 'girl').length;

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const trimmedName = inputName.trim();
    if (!trimmedName) return;

    if (!forceLogin && allBets.some(bet => bet.name === trimmedName)) {
      setLoginError(`「${trimmedName}」已經有人下注囉！如果是你本人請再次點擊登入，否則請更換暱稱。`);
      setForceLogin(true);
      return;
    }

    setCurrentUser(trimmedName);
    localStorage.setItem('genderReveal_userName', trimmedName);
    setForceLogin(false);
  };

  const handleLogout = () => {
    setCurrentUser('');
    setInputName('');
    setLoginError('');
    localStorage.removeItem('genderReveal_userName');
  };

  const handleVote = async (gender, e) => {
    setVoteError('');
    if (isClosed) {
      setVoteError('已收盤，無法下注');
      return;
    }
    const numAmount = Number(amount);
    if (!amount || numAmount < 100 || numAmount > 1000) {
      setVoteError('下注金額限 100 ~ 1,000 元');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const newSticker = { id: Date.now(), gender: gender, x: rect.left + rect.width / 2 - 25, y: rect.top };
    setStickers(prev => [...prev, newSticker]);
    setTimeout(() => {
      setStickers(prev => prev.filter(s => s.id !== newSticker.id));
    }, 1200);

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
      setVoteError("網路異常，寫入失敗請重試");
    }
  };

  const handleDeleteBet = async () => {
    if (isClosed) return;
    try {
      const docRef = doc(db, 'bets', currentUser);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("刪除失敗:", error);
    }
  };

  const handleEditBet = () => {
    if (isClosed) return;
    if (myBet) {
      setAmount(myBet.amount.toString());
      handleDeleteBet();
    }
  };

  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#faf9f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Noto Sans TC', 'SF Pro Display', -apple-system, sans-serif",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          input::placeholder { color: #b8b0a8; }
          input:focus { outline: none; }
        `}</style>

        <div style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
          width: '100%',
          maxWidth: '400px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '48px 36px 40px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.04)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '32px',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(145deg, #e8f0fe, #d4e4fc)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(100,149,237,0.15)',
              }}>
                <img src={boyImg} alt="Boy" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
              </div>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(145deg, #fde8ef, #fcd4e2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(236,100,150,0.15)',
              }}>
                <img src={girlImg} alt="Girl" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
              </div>
            </div>

            <h1 style={{
              textAlign: 'center',
              fontSize: '22px',
              fontWeight: 700,
              color: '#2c2825',
              marginBottom: '6px',
              letterSpacing: '1px',
            }}>是林底迪還是林美眉</h1>
            <p style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#9e958c',
              marginBottom: '36px',
              fontWeight: 400,
            }}>賠率1:1!!!!!</p>

            {(() => {
              const countdown = getCountdown();
              return (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '28px',
                  padding: '12px 16px',
                  background: isClosed ? '#fef2f2' : '#f6f4f1',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: isClosed ? '#c53030' : '#9e958c',
                  fontWeight: 500,
                  lineHeight: 1.6,
                }}>
                  {isClosed ? (
                    <span>已收盤，僅供查看</span>
                  ) : (
                    <>
                      <div>收盤時間：4/25（六）17:00</div>
                      {countdown && (
                        <div style={{ marginTop: '4px', fontWeight: 700, fontSize: '14px', color: '#6b6360' }}>
                          {countdown.days > 0 && `${countdown.days}天 `}
                          {String(countdown.hours).padStart(2,'0')}:{String(countdown.minutes).padStart(2,'0')}:{String(countdown.seconds).padStart(2,'0')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="請輸入姓名或暱稱"
                value={inputName}
                onChange={(e) => {
                  setInputName(e.target.value);
                  setForceLogin(false);
                  setLoginError('');
                }}
                required
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: '#f6f4f1',
                  border: '1.5px solid transparent',
                  borderRadius: '14px',
                  fontSize: '16px',
                  textAlign: 'center',
                  color: '#2c2825',
                  transition: 'all 0.2s',
                  marginBottom: loginError ? '0' : '16px',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1.5px solid #c8bfb6';
                  e.target.style.background = '#fff';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1.5px solid transparent';
                  e.target.style.background = '#f6f4f1';
                }}
              />
              {loginError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  marginTop: '10px',
                  marginBottom: '16px',
                  padding: '10px 14px',
                  background: '#fef2f2',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#c53030',
                  lineHeight: 1.5,
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{loginError}</span>
                </div>
              )}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#2c2825',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => e.target.style.background = '#3d3835'}
                onMouseLeave={(e) => e.target.style.background = '#2c2825'}
              >
                {forceLogin ? '是我本人，進入活動' : '進入活動'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 畫面 2：主畫面
  const boyPct = totalAmount ? Math.round((boyAmount / totalAmount) * 100) : 50;
  const girlPct = totalAmount ? Math.round((girlAmount / totalAmount) * 100) : 50;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf9f7',
      padding: '16px',
      fontFamily: "'Noto Sans TC', 'SF Pro Display', -apple-system, sans-serif",
      color: '#2c2825',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #b8b0a8; }
        input:focus { outline: none; }

        @keyframes floatUpFade {
          0% { transform: translateY(0) scale(0.8) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-90px) scale(1.1) rotate(8deg); opacity: 0.8; }
          100% { transform: translateY(-200px) scale(1.3) rotate(-4deg); opacity: 0; }
        }
        .animate-float {
          animation: floatUpFade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          pointer-events: none;
          position: fixed;
          z-index: 50;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bet-row {
          transition: all 0.15s ease;
        }
        .bet-row:hover {
          background: #f0eeeb !important;
        }

        @media (min-width: 768px) {
          .main-layout { flex-direction: row !important; }
          .left-col { flex: 1 !important; }
          .right-col { width: 320px !important; }
        }
      `}</style>

      {stickers.map((sticker) => (
        <img
          key={sticker.id}
          src={sticker.gender === 'boy' ? boyImg : girlImg}
          alt="floating sticker"
          className="animate-float"
          style={{
            left: sticker.x,
            top: sticker.y,
            width: '56px',
            height: '56px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))',
          }}
        />
      ))}

      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* 頂部導覽 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '14px 20px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.04)',
          animation: 'fadeInUp 0.5s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#6dba73',
            }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#2c2825' }}>
              {currentUser}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9e958c', fontSize: '13px', fontWeight: 500,
              padding: '6px 10px', borderRadius: '8px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6b6360'; e.currentTarget.style.background = '#f6f4f1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9e958c'; e.currentTarget.style.background = 'none'; }}
          >
            <LogOut size={15} /> 登出
          </button>
        </div>

        <div className="main-layout" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <div className="left-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 總金額 */}
            <div style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '36px 32px 28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 30px rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.04)',
              animation: 'fadeInUp 0.5s ease 0.1s both',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <p style={{ fontSize: '13px', color: '#9e958c', fontWeight: 500, marginBottom: '8px', letterSpacing: '1px' }}>
                  目前累積總金額
                </p>
                <div style={{
                  fontSize: '44px', fontWeight: 900, color: '#2c2825',
                  letterSpacing: '-1px', lineHeight: 1,
                }}>
                  ${totalAmount.toLocaleString()}
                </div>
              </div>

              {/* 比例條 */}
              <div style={{
                display: 'flex', height: '8px', borderRadius: '99px',
                overflow: 'hidden', background: '#f0eeeb', marginBottom: '16px',
              }}>
                <div style={{
                  width: `${boyPct}%`,
                  background: 'linear-gradient(90deg, #6aafe6, #5a9cd6)',
                  borderRadius: '99px 0 0 99px',
                  transition: 'width 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
                }} />
                <div style={{
                  width: `${girlPct}%`,
                  background: 'linear-gradient(90deg, #e88aab, #e06b92)',
                  borderRadius: '0 99px 99px 0',
                  transition: 'width 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6aafe6' }} />
                  <span style={{ fontSize: '13px', color: '#6b6360', fontWeight: 500 }}>
                    底迪 {boyCount}票 · ${boyAmount.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#6b6360', fontWeight: 500 }}>
                    美眉 {girlCount}票 · ${girlAmount.toLocaleString()}
                  </span>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e88aab' }} />
                </div>
              </div>
            </div>

            <div style={{
              padding: '14px 20px',
              borderRadius: '16px',
              background: isClosed ? '#fef2f2' : '#fff',
              border: `1px solid ${isClosed ? '#fcd4d4' : 'rgba(0,0,0,0.04)'}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              animation: 'fadeInUp 0.5s ease 0.15s both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: isClosed ? '#e53e3e' : '#6dba73',
                }} />
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: isClosed ? '#c53030' : '#6b6360',
                }}>
                  {isClosed ? '已收盤' : '收盤 4/25（六）17:00'}
                </span>
              </div>
              {!isClosed && (() => {
                const countdown = getCountdown();
                if (!countdown) return null;
                return (
                  <span style={{
                    fontSize: '14px', fontWeight: 700, color: '#2c2825',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {countdown.days > 0 && `${countdown.days}天 `}
                    {String(countdown.hours).padStart(2,'0')}:{String(countdown.minutes).padStart(2,'0')}:{String(countdown.seconds).padStart(2,'0')}
                  </span>
                );
              })()}
            </div>

            {/* 下注操作 */}
            <div style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 30px rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.04)',
              animation: 'fadeInUp 0.5s ease 0.2s both',
            }}>
              {isClosed && !myBet ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#2c2825', marginBottom: '6px' }}>已收盤</p>
                  <p style={{ fontSize: '13px', color: '#9e958c' }}>下注時間已截止，等待開獎吧！</p>
                </div>
              ) : !myBet ? (
                <div>
                  <h3 style={{
                    fontSize: '17px', fontWeight: 700, color: '#2c2825',
                    textAlign: 'center', marginBottom: '6px',
                  }}>下注(先輸入金額再選底迪或美眉)</h3>
                  <p style={{
                    fontSize: '12px', color: '#b8b0a8', textAlign: 'center', marginBottom: '24px',
                  }}>下注金額 $100 ~ $1,000</p>

                  <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <span style={{
                      position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)',
                      fontSize: '18px', fontWeight: 700, color: '#c8bfb6',
                    }}>$</span>
                    <input
                      type="number"
                      placeholder="100 ~ 1,000"
                      value={amount}
                      min={100}
                      max={1000}
                      onChange={(e) => { setAmount(e.target.value); setVoteError(''); }}
                      style={{
                        width: '100%',
                        padding: '18px 20px 18px 38px',
                        background: '#f6f4f1',
                        border: '1.5px solid transparent',
                        borderRadius: '14px',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#2c2825',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.border = '1.5px solid #c8bfb6'; e.target.style.background = '#fff'; }}
                      onBlur={(e) => { e.target.style.border = '1.5px solid transparent'; e.target.style.background = '#f6f4f1'; }}
                    />
                  </div>

                  {voteError && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      marginBottom: '16px', fontSize: '13px', color: '#c53030',
                      padding: '8px 12px', background: '#fef2f2', borderRadius: '10px',
                    }}>
                      <AlertCircle size={14} /> {voteError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '14px' }}>
                    <button
                      onClick={(e) => handleVote('boy', e)}
                      style={{
                        flex: 1,
                        background: '#fff',
                        border: '2px solid #d4e4fc',
                        borderRadius: '20px',
                        padding: '28px 16px 24px',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#eef4fd';
                        e.currentTarget.style.borderColor = '#9ec5f0';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(100,149,237,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#d4e4fc';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <img src={boyImg} alt="男生" style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '12px' }} />
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#5a9cd6', letterSpacing: '1px' }}>底迪</span>
                    </button>

                    <button
                      onClick={(e) => handleVote('girl', e)}
                      style={{
                        flex: 1,
                        background: '#fff',
                        border: '2px solid #fcd4e2',
                        borderRadius: '20px',
                        padding: '28px 16px 24px',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fdf0f4';
                        e.currentTarget.style.borderColor = '#f0a0be';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(236,100,150,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#fcd4e2';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <img src={girlImg} alt="女生" style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '12px' }} />
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#e06b92', letterSpacing: '1px' }}>美眉</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <p style={{ fontSize: '13px', color: '#9e958c', fontWeight: 500, marginBottom: '20px' }}>你的預測</p>
                  <div style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                    padding: '24px 48px',
                    borderRadius: '20px',
                    marginBottom: '28px',
                    border: `2px solid ${myBet.gender === 'boy' ? '#d4e4fc' : '#fcd4e2'}`,
                    background: myBet.gender === 'boy' ? '#f5f9fe' : '#fef5f8',
                  }}>
                    <img
                      src={myBet.gender === 'boy' ? boyImg : girlImg}
                      alt="預測"
                      style={{ width: '52px', height: '52px', objectFit: 'contain', marginBottom: '10px' }}
                    />
                    <span style={{
                      fontWeight: 700, fontSize: '15px',
                      color: myBet.gender === 'boy' ? '#5a9cd6' : '#e06b92',
                    }}>
                      {myBet.gender === 'boy' ? '預測底迪' : '預測美眉'}
                    </span>
                    <span style={{
                      fontSize: '28px', fontWeight: 900, marginTop: '4px',
                      color: myBet.gender === 'boy' ? '#4a8bc6' : '#d05a82',
                    }}>
                      ${myBet.amount.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {isClosed ? (
                      <div style={{
                        flex: 1, textAlign: 'center', padding: '14px 16px',
                        background: '#f6f4f1', borderRadius: '14px',
                        fontSize: '13px', color: '#b8b0a8', fontWeight: 500,
                      }}>
                        🔒 已收盤，無法修改
                      </div>
                    ) : (
                    <>
                    <button
                      onClick={handleEditBet}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '14px 16px', background: '#f6f4f1', border: 'none',
                        borderRadius: '14px', cursor: 'pointer', fontWeight: 600,
                        fontSize: '14px', color: '#6b6360', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#edeae6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f6f4f1'}
                    >
                      <Edit2 size={16} /> 修改
                    </button>
                    <button
                      onClick={handleDeleteBet}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '14px 16px', background: '#fef2f2', border: 'none',
                        borderRadius: '14px', cursor: 'pointer', fontWeight: 600,
                        fontSize: '14px', color: '#c53030', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fde8e8'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                    >
                      <Trash2 size={16} /> 重新下注
                    </button>
                    </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 賭盤 */}
          <div className="right-col" style={{
            width: '100%',
            background: '#fff',
            borderRadius: '24px',
            padding: '28px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 30px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.04)',
            alignSelf: 'flex-start',
            animation: 'fadeInUp 0.5s ease 0.3s both',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2c2825' }}>
                所有預測
              </h3>
              <span style={{
                fontSize: '12px', fontWeight: 600, color: '#9e958c',
                background: '#f6f4f1', padding: '4px 10px', borderRadius: '99px',
              }}>
                {allBets.length} 人
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allBets.length === 0 ? (
                <p style={{
                  color: '#b8b0a8', fontSize: '14px', textAlign: 'center',
                  padding: '40px 0',
                }}>
                  還沒有人下注
                </p>
              ) : (
                allBets.map((bet, i) => (
                  <div
                    key={bet.name}
                    className="bet-row"
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: bet.name === currentUser ? '#f8f6f3' : 'transparent',
                      animation: `fadeInUp 0.4s ease ${0.05 * i}s both`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={bet.gender === 'boy' ? boyImg : girlImg}
                        alt="icon"
                        style={{
                          width: '32px', height: '32px', objectFit: 'contain',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))',
                        }}
                      />
                      <span style={{
                        fontWeight: bet.name === currentUser ? 700 : 500,
                        fontSize: '14px',
                        color: '#2c2825',
                      }}>
                        {bet.name}
                        {bet.name === currentUser && (
                          <span style={{
                            fontSize: '11px', marginLeft: '6px',
                            color: '#9e958c', fontWeight: 400,
                          }}>（你）</span>
                        )}
                      </span>
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: '14px',
                      color: bet.gender === 'boy' ? '#5a9cd6' : '#e06b92',
                    }}>
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