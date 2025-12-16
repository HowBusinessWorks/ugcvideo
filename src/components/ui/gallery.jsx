import { useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Link } from "wasp/client/router";
import { routes } from "wasp/client/router";
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Dialog, DialogContent, DialogTrigger } from './dialog';
export const PhotoGallery = ({ animationDelay = 0.5, }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        // First make the container visible with a fade-in
        const visibilityTimer = setTimeout(() => {
            setIsVisible(true);
        }, animationDelay * 1000);
        // Then start the photo animations after a short delay
        const animationTimer = setTimeout(() => {
            setIsLoaded(true);
        }, (animationDelay + 0.4) * 1000); // Add 0.4s for the opacity transition
        return () => {
            clearTimeout(visibilityTimer);
            clearTimeout(animationTimer);
        };
    }, [animationDelay]);
    // Animation variants for the container
    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1, // Reduced from 0.3 to 0.1 since we already have the fade-in delay
            },
        },
    };
    // Animation variants for each photo
    const photoVariants = {
        hidden: {
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
        },
        visible: (custom) => ({
            x: custom.x,
            y: custom.y,
            rotate: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 70,
                damping: 12,
                mass: 1,
                delay: custom.order * 0.15,
            },
        }),
    };
    // Photo positions - responsive layout
    const photos = [
        {
            id: 1,
            order: 0,
            x: { desktop: "-420px", mobile: "-120px" },
            y: { desktop: "15px", mobile: "10px" },
            zIndex: 50, // Highest z-index (on top)
            direction: "left",
            videoSrc: "/ugc-videos/Labubu.mp4",
            text: "Labubu",
            mobileHide: true, // Hide on mobile to prevent overflow
        },
        {
            id: 2,
            order: 1,
            x: { desktop: "-260px", mobile: "-155px" },
            y: { desktop: "32px", mobile: "10px" },
            zIndex: 40,
            direction: "left",
            videoSrc: "/ugc-videos/Michael Kors.mp4",
            text: "Michael Kors",
            mobileHide: false,
        },
        {
            id: 3,
            order: 2,
            x: { desktop: "-100px", mobile: "-75px" },
            y: { desktop: "8px", mobile: "0px" },
            zIndex: 30,
            direction: "right",
            videoSrc: "/ugc-videos/Tom Ford.mp4",
            text: "Tom Ford",
            mobileHide: false,
        },
        {
            id: 4,
            order: 3,
            x: { desktop: "60px", mobile: "15px" },
            y: { desktop: "22px", mobile: "10px" },
            zIndex: 20,
            direction: "right",
            videoSrc: "/ugc-videos/Tinted serum.mp4",
            text: "Tinted Serum",
            mobileHide: false,
        },
        {
            id: 5,
            order: 4,
            x: { desktop: "220px", mobile: "120px" },
            y: { desktop: "44px", mobile: "25px" },
            zIndex: 10, // Lowest z-index (at bottom)
            direction: "left",
            videoSrc: "/ugc-videos/Yoda Elfi.mp4",
            text: "Yoda Elfi",
            mobileHide: true, // Hide on mobile to prevent overflow
        },
    ];
    // Use state to handle responsive filtering
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    // Filter photos for mobile (hide outer ones)
    const filteredPhotos = isMobile
        ? photos.filter(photo => !photo.mobileHide)
        : photos;
    return (<div className="mt-8 relative">
       <div className="absolute inset-0 max-md:hidden top-[200px] -z-10 h-[300px] w-full bg-transparent bg-[linear-gradient(to_right,#57534e_1px,transparent_1px),linear-gradient(to_bottom,#57534e_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:bg-[linear-gradient(to_right,#a8a29e_1px,transparent_1px),linear-gradient(to_bottom,#a8a29e_1px,transparent_1px)]"></div>
      <p className="lg:text-md my-2 text-center text-xs font-light uppercase tracking-widest text-slate-600 dark:text-slate-400">
        AI-Powered UGC Video Generation
      </p>
      <h3 className="z-20 mx-auto max-w-2xl justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text py-3 text-center text-3xl sm:text-4xl text-transparent dark:bg-gradient-to-r dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:bg-clip-text md:text-7xl px-4">
        Create Authentic <span className="text-primary">UGC Videos</span>
      </h3>
      <div className="relative -mb-4 md:mb-8 h-[350px] md:h-[350px] w-full items-center justify-center lg:flex overflow-hidden">
        <motion.div className="relative mx-auto flex w-full max-w-7xl justify-center" initial={{ opacity: 0 }} animate={{ opacity: isVisible ? 1 : 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <motion.div className="relative flex w-full justify-center items-center" variants={containerVariants} initial="hidden" animate={isLoaded ? "visible" : "hidden"}>
            <div className={`relative ${isMobile ? 'h-[140px] w-[320px]' : 'h-[220px] w-[640px]'} mx-auto`}>
              {/* Render photos in reverse order so that higher z-index photos are rendered later in the DOM */}
              {[...filteredPhotos].reverse().map((photo) => (<motion.div key={photo.id} className="absolute left-1/2 top-0 -translate-x-1/2" style={{ zIndex: photo.zIndex }} // Apply z-index directly in style
         variants={photoVariants} custom={{
                x: isMobile ? photo.x.mobile : photo.x.desktop,
                y: isMobile ? photo.y.mobile : photo.y.desktop,
                order: photo.order,
            }}>
                  <Dialog>
                    <DialogTrigger asChild>
                      <div>
                        <Photo width={isMobile ? 140 : 220} height={isMobile ? 140 : 220} videoSrc={photo.videoSrc} text={photo.text} alt="UGC Video thumbnail" direction={photo.direction}/>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm w-full p-0 bg-black border-gray-800">
                      <div className="relative aspect-[9/16] w-full bg-black rounded-lg overflow-hidden">
                        <video className="w-full h-full object-contain" controls autoPlay loop>
                          <source src={photo.videoSrc} type="video/mp4"/>
                        </video>
                        <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg px-3 py-1">
                          <span className="text-white font-medium">{photo.text}</span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      <div className="flex w-full justify-center">
      <Link to={routes.VideoGeneratorRoute.to}>
        <Button size="lg">
          Start Creating Videos
        </Button>
      </Link>
      </div>
    </div>);
};
function getRandomNumberInRange(min, max) {
    if (min >= max) {
        throw new Error("Min value should be less than max value");
    }
    return Math.random() * (max - min) + min;
}
export const Photo = ({ videoSrc, text, alt, className, direction, width, height, ...props }) => {
    const [rotation, setRotation] = useState(0);
    const x = useMotionValue(200);
    const y = useMotionValue(200);
    useEffect(() => {
        const randomRotation = getRandomNumberInRange(1, 4) * (direction === "left" ? -1 : 1);
        setRotation(randomRotation);
    }, []);
    function handleMouse(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
    }
    const resetMouse = () => {
        x.set(200);
        y.set(200);
    };
    return (<motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} whileTap={{ scale: 1.2, zIndex: 9999 }} whileHover={{
            scale: 1.1,
            rotateZ: 2 * (direction === "left" ? -1 : 1),
            zIndex: 9999,
            transition: { duration: 0.2, ease: "easeOut" },
        }} whileDrag={{
            scale: 1.1,
            zIndex: 9999,
            transition: { duration: 0.1 },
        }} initial={{ rotate: 0 }} animate={{ rotate: rotation }} style={{
            width,
            height,
            perspective: 400,
            transform: `rotate(0deg) rotateX(0deg) rotateY(0deg)`,
            zIndex: 1,
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            touchAction: "none",
        }} className={cn(className, "relative mx-auto shrink-0 cursor-grab active:cursor-grabbing")} onMouseMove={handleMouse} onMouseLeave={resetMouse} draggable={false} tabIndex={0}>
      <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-sm">
        <video className="w-full h-full object-cover rounded-3xl" muted loop playsInline autoPlay preload="metadata">
          <source src={videoSrc} type="video/mp4"/>
        </video>
      </div>
    </motion.div>);
};
