import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { CheckCircle, XCircle, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const QuizModal = ({ isOpen, onClose, quizData, noteTitle }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

    const handleOptionSelect = (index) => {
        if (isAnswerChecked) return;
        setSelectedOption(index);
    };

    const handleCheckAnswer = () => {
        setIsAnswerChecked(true);
        if (selectedOption === quizData[currentQuestion].correctIndex) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        setSelectedOption(null);
        setIsAnswerChecked(false);
        if (currentQuestion < quizData.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResults(true);
        }
    };

    const resetQuiz = () => {
        setCurrentQuestion(0);
        setScore(0);
        setShowResults(false);
        setSelectedOption(null);
        setIsAnswerChecked(false);
    };

    if (!quizData) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { resetQuiz(); onClose(); }}
            title={`Quiz: ${noteTitle}`}
            size="lg"
        >
            <div className="p-2">
                {!showResults ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                            <span>Question {currentQuestion + 1} of {quizData.length}</span>
                            <span className="font-bold text-primary-500">Score: {score}</span>
                        </div>

                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all duration-300"
                                style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                            />
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {quizData[currentQuestion].question}
                        </h3>

                        <div className="space-y-3">
                            {quizData[currentQuestion].options.map((option, index) => {
                                let optionClass = "w-full p-4 rounded-xl border-2 text-left transition-all font-medium flex justify-between items-center ";

                                if (isAnswerChecked) {
                                    if (index === quizData[currentQuestion].correctIndex) {
                                        optionClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                                    } else if (index === selectedOption) {
                                        optionClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                                    } else {
                                        optionClass += "border-slate-200 dark:border-slate-700 opacity-50";
                                    }
                                } else {
                                    if (selectedOption === index) {
                                        optionClass += "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300";
                                    } else {
                                        optionClass += "border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-slate-800";
                                    }
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleOptionSelect(index)}
                                        className={optionClass}
                                        disabled={isAnswerChecked}
                                    >
                                        <span>{option}</span>
                                        {isAnswerChecked && index === quizData[currentQuestion].correctIndex && <CheckCircle size={20} className="text-green-500" />}
                                        {isAnswerChecked && index === selectedOption && index !== quizData[currentQuestion].correctIndex && <XCircle size={20} className="text-red-500" />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="pt-4 flex justify-end">
                            {!isAnswerChecked ? (
                                <Button
                                    onClick={handleCheckAnswer}
                                    disabled={selectedOption === null}
                                    className="w-full md:w-auto"
                                >
                                    Check Answer
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    className="w-full md:w-auto"
                                >
                                    {currentQuestion < quizData.length - 1 ? 'Next Question' : 'View Results'}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6 py-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto text-yellow-500"
                        >
                            <Award size={48} />
                        </motion.div>

                        <div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Quiz Complete!</h3>
                            <p className="text-slate-500 dark:text-slate-400">You scored</p>
                            <div className="text-5xl font-black text-primary-600 dark:text-primary-400 my-4">
                                {score} <span className="text-2xl text-slate-400 font-normal">/ {quizData.length}</span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={() => { resetQuiz(); onClose(); }}>Close</Button>
                            <Button onClick={resetQuiz}>Retake Quiz</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default QuizModal;
