import React, { useState } from 'react';
import { Download, X, Share2, PlusSquare, Heart, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, shouldShowBanner, install, dismissBanner } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed or banner condition not met, return null
  if (isInstalled || !shouldShowBanner) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <div className="mx-4 my-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#C85A32]/10 via-[#FAF7F2] to-[#FB7185]/10 dark:from-[#C85A32]/20 dark:via-[#1F1B18] dark:to-[#FB7185]/20 border border-[#C85A32]/25 dark:border-[#C85A32]/40 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C85A32] flex items-center justify-center text-white shrink-0 shadow-md">
              <Heart size={20} fill="white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                Install Me & You
              </h2>
              <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-0.5 leading-snug">
                Add to your home screen for quick countdown checks, offline journals, and native notifications.
              </p>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            aria-label="Dismiss install banner"
            className="text-[#9C8F85] hover:text-[#4A423B] dark:hover:text-[#F3EFEA] p-1 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#C85A32] hover:bg-[#B34E29] text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow-sm transition-all min-h-[44px] cursor-pointer active:scale-95"
          >
            {isIOS ? (
              <>
                <Share2 size={15} />
                <span>Add to iPhone Home Screen</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Install App</span>
              </>
            )}
          </button>
          <button
            onClick={dismissBanner}
            className="text-xs font-medium text-[#7A6F66] dark:text-[#A89F95] hover:text-[#2D2825] py-2 px-3 rounded-xl min-h-[44px] cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>

      {/* iOS Safari Guided Install Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C85A32]/10 dark:bg-[#C85A32]/20 flex items-center justify-center text-[#C85A32] mb-3">
              <Smartphone size={26} />
            </div>
            <h2 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA]">
              Install on iPhone or iPad
            </h2>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1.5 mb-5">
              Follow these simple steps in Safari to add Me & You to your home screen:
            </p>

            <div className="space-y-3 text-left mb-6">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38312B]">
                <div className="w-7 h-7 rounded-full bg-[#C85A32]/15 text-[#C85A32] font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="text-xs text-[#3E3833] dark:text-[#DDD5CC] leading-relaxed">
                  Tap the <strong className="text-[#C85A32]">Share</strong> icon{' '}
                  <span className="inline-block p-1 bg-gray-100 dark:bg-gray-800 rounded align-middle">
                    <Share2 size={13} className="inline text-[#C85A32]" />
                  </span>{' '}
                  in the Safari navigation toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38312B]">
                <div className="w-7 h-7 rounded-full bg-[#C85A32]/15 text-[#C85A32] font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="text-xs text-[#3E3833] dark:text-[#DDD5CC] leading-relaxed">
                  Scroll down the menu and select{' '}
                  <strong className="text-[#C85A32]">Add to Home Screen</strong>{' '}
                  <span className="inline-block p-1 bg-gray-100 dark:bg-gray-800 rounded align-middle">
                    <PlusSquare size={13} className="inline text-[#C85A32]" />
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38312B]">
                <div className="w-7 h-7 rounded-full bg-[#C85A32]/15 text-[#C85A32] font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="text-xs text-[#3E3833] dark:text-[#DDD5CC] leading-relaxed">
                  Tap <strong className="text-[#C85A32]">Add</strong> in the top-right corner. Enjoy standalone full-screen view!
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSModal(false);
                dismissBanner();
              }}
              className="w-full bg-[#C85A32] text-white text-xs font-semibold py-3 rounded-2xl min-h-[44px] cursor-pointer hover:bg-[#B34E29] transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
