// /context/progresscontext.js
"use client";
import { createContext, useContext, useState } from "react";

// 自己尝试做全局进度条
const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0); // 默认第一个步骤
  const [isMatchInfoComplete, setMatchInfoComplete] = useState(false); // 是否匹配完成

  // 更新步骤的函数
  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const resetSteps = () => {
    setCurrentStep(0);
    setMatchInfoComplete(false);
  };

  return (
    <ProgressContext.Provider
      value={{
        currentStep,
        isMatchInfoComplete,
        setMatchInfoComplete,
        nextStep,
        resetSteps,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

// Hook: 在组件中使用 ProgressContext
export const useProgress = () => useContext(ProgressContext);
