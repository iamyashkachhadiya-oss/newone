"use client";

import React, { useState } from "react";
import { Send, ChevronDown, CheckCircle2, GraduationCap, Building2, BookOpen } from "lucide-react";

export default function ProjectSubmissionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Project Submitted Successfully!</h2>
          <p className="text-slate-400 mb-8">Your semester project details have been successfully recorded for review.</p>
          <button 
            onClick={() => setIsSubmitted(false)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
          >
            Submit Another Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Project Registration</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Complete your academic project details for Semester 8 below. Fields marked with an asterisk (*) are required.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-semibold text-white">Academic Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Semester */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Semester <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select required className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                    <option value="Semester 8">Semester 8</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Select Project Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Project Status <span className="text-rose-500">*</span></label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="projectStatus" value="Create New" className="peer sr-only" required defaultChecked />
                    <div className="w-full text-center px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 peer-checked:bg-indigo-600/20 peer-checked:border-indigo-500 peer-checked:text-indigo-300 transition-all hover:bg-slate-800/50">
                      Create New
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="projectStatus" value="Half Done" className="peer sr-only" required />
                    <div className="w-full text-center px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 peer-checked:bg-indigo-600/20 peer-checked:border-indigo-500 peer-checked:text-indigo-300 transition-all hover:bg-slate-800/50">
                      Half Done
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Project & Organization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-3">
                <label className="text-sm font-medium text-slate-300">Project Title <span className="text-rose-500">*</span></label>
                <input required type="text" placeholder="Enter complete project title" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Domain Name <span className="text-rose-500">*</span></label>
                <input required type="text" placeholder="e.g. Machine Learning" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">Organization Name <span className="text-rose-500">*</span></label>
                <input required type="text" placeholder="Sponsoring company or institution" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
            </div>
          </div>

          {/* Section 2: Mentorship & Category */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-semibold text-white">Classification & Guidance</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Project Category <span className="text-rose-500">*</span></label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="projectCategory" value="Disciplinary" className="peer sr-only" required defaultChecked />
                    <div className="w-full text-center px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 peer-checked:bg-purple-600/20 peer-checked:border-purple-500 peer-checked:text-purple-300 transition-all hover:bg-slate-800/50">
                      Disciplinary
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="projectCategory" value="Inter-Disciplinary" className="peer sr-only" required />
                    <div className="w-full text-center px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 peer-checked:bg-purple-600/20 peer-checked:border-purple-500 peer-checked:text-purple-300 transition-all hover:bg-slate-800/50">
                      Inter-Disciplinary
                    </div>
                  </label>
                </div>
              </div>

              {/* Internal Guide */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Internal Guide <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select required className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                    <option value="" disabled selected>Select an internal guide...</option>
                    <option value="Head_of_Institute_146">Head_of_Institute_146 (bec146owner@gtu.edu.in)</option>
                    <option value="HOD_146_42">HOD_146_42 (be_146_42_head@gtu.edu.in)</option>
                    <option value="HOD_146_44">HOD_146_44 (be_146_44_head@gtu.edu.in)</option>
                    <option value="HOD_146_45">HOD_146_45 (be_146_45_head@gtu.edu.in)</option>
                    <option value="Mr. Biplab Roy">Mr. Biplab Roy (biplab.diatm24@gmail.com)</option>
                    <option value="Mr. GAJANAN SHANKAR KUMBHAR">Mr. GAJANAN SHANKAR KUMBHAR (gsk.sdcet@gmail.com)</option>
                    <option value="Mrs. JIGNASHA PRADIPBHAI PATEL">Mrs. JIGNASHA PRADIPBHAI PATEL (jignasha889118@gmail.com)</option>
                    <option value="Mr. mithilesh kumar singh">Mr. mithilesh kumar singh (singhmk2102@gmail.com)</option>
                    <option value="Mr. Mritunjay Kumar Yadav">Mr. Mritunjay Kumar Yadav (prof.mritunjay.kumar92@gmail.com)</option>
                    <option value="Miss. Trupti V Gondaliya">Miss. Trupti V Gondaliya (trupti341@gmail.com)</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Project Type */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">Project Type <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-3 gap-4">
                  <label className="cursor-pointer">
                    <input type="radio" name="projectType" value="Online_Internship" className="peer sr-only" required />
                    <div className="w-full text-center px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-blue-300 transition-all hover:bg-slate-800/50 text-sm">
                      Online Internship
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="projectType" value="Offline_Internship" className="peer sr-only" required />
                    <div className="w-full text-center px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-blue-300 transition-all hover:bg-slate-800/50 text-sm">
                      Offline Internship
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="projectType" value="MiniProject" className="peer sr-only" required />
                    <div className="w-full text-center px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-blue-300 transition-all hover:bg-slate-800/50 text-sm">
                      Mini Project
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Keywords & Abstract */}
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Keyword 1 <span className="text-rose-500">*</span></label>
                <input required type="text" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Keyword 2</label>
                <input type="text" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Keyword 3</label>
                <input type="text" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Keyword 4</label>
                <input type="text" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Keyword 5</label>
                <input type="text" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Project Abstract <span className="text-rose-500">*</span></label>
              <textarea 
                required 
                rows={6}
                placeholder="Provide a comprehensive summary of your project..." 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
              ></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto md:min-w-[200px] flex items-center justify-center gap-2 py-3 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-70 disabled:cursor-not-allowed ml-auto"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Submit Project
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
