import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, User, Building2, Grid, Phone, School, BookOpen } from "lucide-react";

export function WhomToConfess() {
  const navigate = useNavigate();
  const [personName, setPersonName] = useState("");
  const [college, setCollege] = useState("");
  const [semester, setSemester] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [mobile, setMobile] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleContinue = () => {
    if (!personName.trim()) {
      showToast("Please enter the person's name!");
      return;
    }
    if (!college) {
      showToast("Please select their college!");
      return;
    }
    if (!semester) {
      showToast("Please select their semester!");
      return;
    }
    navigate("/choose-path", { state: { personName: personName.trim(), targetCollege: college, targetSemester: semester } });
  };

  return (
    <div className="w-full max-w-[440px] mx-auto py-2 px-2 space-y-6 flex flex-col items-center relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-primary text-on-primary px-6 py-3 rounded-full shadow-xl text-sm font-semibold animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Main Container Island */}
      <div className="w-full bg-surface rounded-[32px] neomorphic-outset overflow-hidden flex flex-col border border-outline-variant/20 relative">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 h-16 w-full sticky top-0 bg-surface z-10 rounded-t-[32px] border-b border-outline-variant/20">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface neomorphic-outset active:scale-95 transition-all text-primary hover:bg-surface-container cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="font-bold text-on-surface text-base">Whom Must Know</span>

          <button
            onClick={handleContinue}
            className="text-primary font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-opacity active:scale-95 px-2 cursor-pointer"
          >
            Continue
          </button>
        </header>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-on-surface-variant text-center px-2">
            Provide details to help us notify them anonymously.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="space-y-4">
            {/* Person's Name */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Person's Name *"
                required
                className="w-full neo-inset rounded-xl py-4 pl-12 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant transition-all bg-transparent"
              />
            </div>

            {/* College */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                <School className="w-5 h-5" />
              </div>
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full neo-inset rounded-xl py-4 pl-12 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-transparent appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-outline-variant">Select College</option>
                <option value="Arya (OLD), kukas">Arya (OLD), kukas</option>
                <option value="Arya (MAIN), kukas">Arya (MAIN), kukas</option>
                <option value="JEC, kukas">JEC, kukas</option>
                <option value="Shankara, kukas">Shankara, kukas</option>
              </select>
            </div>

            {/* Semester */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                <BookOpen className="w-5 h-5" />
              </div>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full neo-inset rounded-xl py-4 pl-12 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-transparent appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-outline-variant">Select Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">3rd Semester</option>
                <option value="4">4th Semester</option>
                <option value="5">5th Semester</option>
                <option value="6">6th Semester</option>
                <option value="7">7th Semester</option>
                <option value="8">8th Semester</option>
              </select>
            </div>

            {/* Two Column Layout: Branch & Section */}
            <div className="flex gap-3">
              {/* Branch */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <Building2 className="w-5 h-5" />
                </div>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full neo-inset rounded-xl py-4 pl-12 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-transparent appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-outline-variant">Select Branch</option>
                  <option value="CS">CS</option>
                  <option value="IT">IT</option>
                  <option value="AI & DS">AI & DS</option>
                  <option value="Elec & Co. E">Elec & Co. E</option>
                  <option value="E.E">E.E</option>
                  <option value="M.E">M.E</option>
                </select>
              </div>

              {/* Section */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <Grid className="w-5 h-5" />
                </div>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full neo-inset rounded-xl py-4 pl-12 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-transparent appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-outline-variant">Select Section</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                  <option value="E">Section E</option>
                  <option value="F">Section F</option>
                  <option value="G">Section G</option>
                </select>
              </div>
            </div>

            {/* Mobile Number */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile Number"
                className="w-full neo-inset rounded-xl py-4 pl-12 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant transition-all bg-transparent"
              />
            </div>

            {/* Additional Info */}
            <div className="relative pt-1">
              <textarea
                rows={4}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Tell us more to help us find them..."
                className="w-full neo-inset rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant transition-all resize-none bg-transparent"
              ></textarea>
            </div>
          </form>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-surface/90 border-t border-outline-variant/20 rounded-b-[32px]">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full bg-primary text-on-primary rounded-full py-4 px-6 flex items-center justify-between group active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="text-base font-bold text-on-primary">Continue</span>
            <ArrowRight className="w-5 h-5 text-on-primary group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

