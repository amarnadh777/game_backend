import axios from 'axios';
import React, { useEffect, useState } from 'react';
import ExportModal from '../components/ExportModal';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';
// --- IMAGE LOADER COMPONENT ---
const ImageWithLoading = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse z-0">
          <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 relative z-10`}
      />
    </div>
  );
};
const BANNER_OPTIONS = [
  "Start Point Billboard",
  "Race Track Billboard",
  "Stand Billboards",
  "Flag Billboards",
  "Fence Billboards",
  "Building Top Billboards",
  "Arch Top Billboards",
  "Road Billboards",
  "Trackside Billboard Long"
];

const BANNER_MAPPING = [
  {
    id: "arch_top_billboards",
    name: "Arch Top Billboards",
    description: "Billboards placed on top of arches across the track, highly visible during race transitions.",
    referenceImage: "/image9.png"
  },
  {
    id: "building_top_billboards",
    name: "Building Top Billboards",
    description: "Advertisements displayed on rooftops of surrounding buildings, offering wide-angle visibility.",
    referenceImage: "/image6.png"
  },
  {
    id: "fence_billboards",
    name: "Fence Line Billboards",
    description: "Banners aligned along trackside fences, visible throughout the race path.",
    referenceImage: "/image4.png"
  },
  {
    id: "flag_billboards",
    name: "Flag Billboards",
    description: "Branding displayed on flag-style banners placed strategically along the track.",
    referenceImage: "/image3.png"
  },
  {
    id: "road_billboards",
    name: "Roadside Billboards",
    description: "Billboards placed along the road edges, ensuring continuous exposure during gameplay.",
    referenceImage: "/image1.png"
  },
  {
    id: "stand_billboards",
    name: "Stand Billboards",
    description: "Advertisements positioned near spectator stands for maximum audience visibility.",
    referenceImage: "/image5.png"
  },
  {
    id: "start_point_billboard",
    name: "Start Point Billboard",
    description: "High-impact billboard placed at the race starting point for maximum initial exposure.",
    referenceImage: "/image7.png"
  },
  {
    id: "trackside_billboard_long",
    name: "Trackside Long Billboards",
    description: "Extended horizontal billboards running parallel to the track for prolonged visibility.",
    referenceImage: "/image8.png"
  },
  {
    id: "race_track_billboard",
    name: "Race Track Billboard",
    description: "Billboards placed along the race track for maximum visibility during the race.",
    referenceImage: "/image2.png"
  }
];

const INITIAL_CARS = [
  { id: 'jetour_g700', name: 'Jetour G700', enabled: false, file: null, preview: '' },
  { id: 'deepal_g318', name: 'Deepal G318', enabled: false, file: null, preview: '' },
  { id: 'toyota_land_cruiser_gx_r_3_5l', name: 'Toyota Land Cruiser GX R 3.5L', enabled: false, file: null, preview: '' },
  { id: 'icaur_v27_royal', name: 'iCar V27 Royal', enabled: false, file: null, preview: '' },
  { id: 'lexus_lx_600_urban', name: 'Lexus LX 600 Urban', enabled: false, file: null, preview: '' },
];

const DashboardBanner = () => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- PAGINATION & SEARCH STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;
  const [expandedGroups, setExpandedGroups] = useState({});
  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    file: null,
    status: true,
    imageUrl: ''
  });
  const [imagePrevLoaded, setImagePrevLoaded] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [bannerToClone, setBannerToClone] = useState(null);
  const [cloneName, setCloneName] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  // --- DELETE MODAL STATE ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- SPECIFIC CARS STATE ---
  const [applyToSpecificCars, setApplyToSpecificCars] = useState(false);
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [specificCars, setSpecificCars] = useState(INITIAL_CARS);

  // --- CAR GRID HANDLERS ---
  const handleCarSearch = (e) => setCarSearchQuery(e.target.value);

  const toggleSelectAllCars = (select) => {
    setSpecificCars(prev => prev.map(car => ({ ...car, enabled: select })));
  };

  const toggleSpecificCar = (carId) => {
    setSpecificCars(prev => prev.map(car =>
      car.id === carId ? { ...car, enabled: !car.enabled } : car
    ));
  };

  const handleSpecificCarFile = (carId, file) => {
    if (!file) return;
    setSpecificCars(prev => prev.map(car =>
      car.id === carId ? { ...car, file: file, preview: URL.createObjectURL(file) } : car
    ));
  };

  const filteredCars = specificCars.filter(car =>
    car.name.toLowerCase().includes(carSearchQuery.toLowerCase())
  );

  // --- FETCH BANNERS WITH DEBOUNCE EFFECT ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBanners();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchQuery]);


  const handleCloneBanner = async (bannerId) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/banner/clone/${bannerId}`
      );

      if (response.status === 201) {
        toast.success("Banner cloned successfully");
        fetchBanners(); // refresh list
      }

    } catch (error) {
      toast.error("Failed to clone banner");
      console.error("Clone error:", error);
    }
  };

  const openCloneModal = (banner) => {
    setBannerToClone(banner);
    setCloneName(`${banner.name} Copy`); // Suggest a default name
    setIsCloneModalOpen(true);
  };

  // 2. Closes the modal and resets state
  const closeCloneModal = () => {
    setIsCloneModalOpen(false);
    setBannerToClone(null);
    setCloneName("");
  };

  // 3. Actually makes the API call with the new name
  const submitClone = async () => {
    if (!cloneName.trim()) {
      toast.error("Please enter a name for the cloned banner");
      return;
    }

    setIsCloning(true);
    try {
      // Get the correct ID whether your DB uses _id or id
      const idToClone = bannerToClone.id || bannerToClone._id;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/banner/clone/${idToClone}`,
        { name: cloneName } // Send the new name to the backend!
      );

      if (response.status === 201 || response.data.success) {
        toast.success("Banner cloned successfully");
        fetchBanners(); // Refresh list
        closeCloneModal(); // Hide modal
      }
    } catch (error) {
      toast.error("Failed to clone banner");
      console.error("Clone error:", error);
    } finally {
      setIsCloning(false);
    }
  };


  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/banner/admin-banners?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`);
      if (response.status === 200) {
        const formattedBanners = response.data.banners.map(group => ({

          bannerId: group.bannerId,

          variants: group.variants.map(item => ({

            id: item._id,

            slNo: item.slNo,

            name: item.name,

            imageUrl: item.imageUrl,

            status: item.status,

            isCarSpecific: item.isCarSpecific,

            carImages: item.carImages || [],

            clonedFrom: item.clonedFrom || null,

            isClone: !!item.clonedFrom,

          }))

        }));
        setBanners(formattedBanners);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.total || 0);
      }
    } catch (error) {
      console.error("API Connection Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- PAGINATION HANDLERS ---
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  // --- DELETE HANDLERS ---
  const openDeleteModal = (banner) => {
    setDeletingBanner(banner);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingBanner(null);
  };

  const handleDelete = async () => {
    if (!deletingBanner) return;
    setIsDeleting(true);
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/banner/delete/${deletingBanner.id}`);
      if (response.status === 200) {
        toast.success("Banner deleted successfully.");
        closeDeleteModal();
        fetchBanners();
      } else {
        toast.error("Failed to delete banner.");
      }
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("An error occurred while trying to delete the banner.");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- TABLE TOGGLE STATUS HANDLER ---
  const toggleStatus = async (id) => {

    try {

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/banner/toggle-status/${id}`
      );

      // 🔥 refetch updated banners
      fetchBanners();

    } catch (error) {

      console.error(error);

    }

  };
  // --- ADD/EDIT MODAL HANDLERS ---
  const openAddModal = () => {
    setEditingId(null);
    setImagePrevLoaded(false);
    setFormData({ name: '', file: null, status: true, imageUrl: '' });
    setApplyToSpecificCars(false);
    setSpecificCars(INITIAL_CARS.map(c => ({ ...c, enabled: false, preview: '', file: null })));
    setIsModalOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingId(banner.id);
    setImagePrevLoaded(false);
    setFormData({ name: banner.name, file: null, status: banner.status, imageUrl: banner.imageUrl });

    if (banner.isCarSpecific) {
      setApplyToSpecificCars(true);
      const updatedCars = INITIAL_CARS.map(initialCar => {
        const foundCarImage = banner.carImages?.find(c => c.carId === initialCar.id || c.carName === initialCar.name);
        if (foundCarImage) {
          return {
            ...initialCar,
            enabled: true,
            preview: foundCarImage.imageUrl,
            file: null
          };
        }
        return { ...initialCar, enabled: false, preview: '', file: null };
      });
      setSpecificCars(updatedCars);
    } else {
      setApplyToSpecificCars(false);
      setSpecificCars(INITIAL_CARS.map(c => ({ ...c, enabled: false, preview: '', file: null })));
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', file: null, status: true, imageUrl: '' });
    setApplyToSpecificCars(false);
    setSpecificCars(INITIAL_CARS.map(c => ({ ...c, enabled: false, preview: '', file: null })));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'status' ? value === 'true' : value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!editingId && !applyToSpecificCars && !formData.file) return alert("Please select an image file to upload.");
  //   if (!editingId && applyToSpecificCars && specificCars.filter(c => c.enabled).length === 0) return alert("Please select at least one specific car.");
  //   if (!formData.name) return alert("Please provide a banner name.");

  //   setIsSubmitting(true);
  //   const submitData = new FormData();
  //   submitData.append('name', formData.name);
  //   submitData.append('status', formData.status);
  //   // Check specific cars selection
  //   if (applyToSpecificCars) {
  //     const enabledCars = specificCars.filter(c => c.enabled);
  //     submitData.append('applyToSpecificCars', true);
  //     submitData.append('carData', JSON.stringify(enabledCars.map(c => ({ id: c.id, name: c.name }))));
  //     // Append multiple files
  //     enabledCars.forEach(car => {
  //       if (car.file) submitData.append(`image_${car.id}`, car.file);
  //     });
  //   } else {
  //     submitData.append('isCarSpecific', false);
  //     if (formData.file) submitData.append('files', formData.file); 
  //   }
  //   try {
  //     if (editingId) {
  //       const response = await axios.put(`${import.meta.env.VITE_API_URL}/banner/update/${editingId}`, submitData, {
  //         headers: { 'Content-Type': 'multipart/form-data' }
  //       });
  //       if (response.status === 200) {
  //          fetchBanners(); 
  //          closeModal();
  //       } else alert("Failed to update banner.");
  //     } else {
  //       const response = await fetch(`${import.meta.env.VITE_API_URL}/banner/upload`, {
  //         method: 'POST',
  //         body: submitData, 
  //       });
  //       if (response.ok) {
  //         fetchBanners();
  //         closeModal();
  //       } else {
  //         const result = await response.json();
  //         alert(`Upload failed: ${result.message}`);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("API Error:", error);
  //     alert("Failed to connect to the server.");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. If NOT editing and NOT specific cars, a file is required.
    if (!editingId && !applyToSpecificCars && !formData.file) {
      toast.error("Please select an image file to upload.");
      return;
    }

    // 2. FIXED: If specific cars is selected, at least one car MUST be checked (for BOTH Add and Edit).
    if (applyToSpecificCars && specificCars.filter(c => c.enabled).length === 0) {
      toast.error("Please select at least one specific car.");
      return;
    }

    // 3. Name is always required
    if (!formData.name) {
      toast.error("Please provide a banner name.");
      return;
    }

    setIsSubmitting(true);
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('status', formData.status);

    // Find the matching ID and append it to FormData
    const selectedBanner = BANNER_MAPPING.find(b => b.name === formData.name);
    if (selectedBanner) {
      submitData.append('bannerId', selectedBanner.id);
    }

    // ==========================================
    // Match Backend Expectations
    // ==========================================
    if (applyToSpecificCars) {
      const enabledCars = specificCars.filter(c => c.enabled);

      // Backend expects the key "isCarSpecific" and the string "true"
      submitData.append('isCarSpecific', 'true');

      enabledCars.forEach((car, index) => {
        // Backend expects req.body[`cars[${index}][carId]`]
        submitData.append(`cars[${index}][carId]`, car.id);
        submitData.append(`cars[${index}][carName]`, car.name);

        // Backend expects the file's fieldname to match the regex /cars\[(\d+)\]/
        if (car.file) {
          submitData.append(`cars[${index}][image]`, car.file);
        }
      });
    }
    else {
      // Normal single banner upload
      submitData.append('isCarSpecific', 'false');
      if (formData.file) {
        submitData.append('files', formData.file);
      }
    }

    // ==========================================
    // API CALLS 
    // ==========================================
    try {
      if (editingId) {
        const response = await axios.put(`${import.meta.env.VITE_API_URL}/banner/update/${editingId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.status === 200) {
          toast.success("Banner updated successfully!");
          fetchBanners();
          closeModal();
        } else toast.error("Failed to update banner.");
      } else {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/banner/upload`, {
          method: 'POST',
          body: submitData,
        });
        if (response.ok) {
          toast.success("Banner uploaded successfully!");
          fetchBanners();
          closeModal();
        } else {
          const result = await response.json();
          toast.error(`Upload failed: ${result.message}`);
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Failed to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    // Replaced layout wrapper with the light blue background spanning full width
    <div className="w-full min-h-screen p-6 md:p-8 bg-[#EBF5FF] flex flex-col gap-4">

      {/* Page Title */}
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-wide mb-2">
        Welcome To Kanoo Daily Rental
      </h1>

      {/* Main White Card Container */}
      <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden border border-white">

        {/* Card Header (Title & Button) */}
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-gray-900">
            Banner Details
          </h2>

          {/* Yellow Upload Button */}
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-[#FDE57E] to-[#F1C82A] text-slate-800 text-sm font-semibold py-2 px-5 rounded-lg transition-transform active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Upload New Banner
          </button>
        </div>

        {/* Table Area */}
        {/* Table Area */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700 w-[120px]">Image</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Banner Name</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700 w-32">Status</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700 w-56">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="4" className="py-12 text-center text-gray-500">Loading banners...</td></tr>
              ) : banners.length === 0 ? (
                <tr><td colSpan="4" className="py-12 text-center text-gray-500 font-medium">No banners found. Start by adding a new banner!</td></tr>
              ) : (
                banners.map((group) => {
                  const hasMultipleVariants = group.variants.length > 1;
                  const isExpanded = expandedGroups[group.bannerId];
                  const firstBanner = group.variants[0];

                  return (
                    <React.Fragment key={group.bannerId}>

                      {/* ========================================== */}
                      {/* 1. SINGLE VARIANT ROW */}
                      {/* ========================================== */}
                      {!hasMultipleVariants && (
                        <tr className="hover:bg-slate-50 transition-colors bg-white">
                          {/* Image Column */}
                          <td className="py-4 px-6 w-[120px]">
                            <div className="w-[60px] h-[40px] bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
                              {firstBanner.isCarSpecific && firstBanner.carImages?.length > 0 ? (
                                <ImageWithLoading src={firstBanner.carImages[0].imageUrl} alt={firstBanner.name} className="w-full h-full object-cover" />
                              ) : firstBanner.imageUrl ? (
                                <ImageWithLoading src={firstBanner.imageUrl} alt={firstBanner.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-gray-400">No Img</span>
                              )}
                            </div>
                          </td>

                          {/* Banner Name Column */}
                          <td className="py-4 px-6 min-w-[250px]">
                            <div className="flex flex-col gap-2">
                              <span className="text-[14px] font-bold text-slate-800">{firstBanner.name}</span>
                              {firstBanner.isCarSpecific && firstBanner.carImages && firstBanner.carImages.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {firstBanner.carImages.map((car, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-1 pr-2.5 bg-white border border-gray-200 rounded-lg shadow-sm cursor-default" title={`Banner for ${car.carName}`}>
                                      <div className="w-7 h-7 bg-white rounded overflow-hidden border border-gray-100 flex-shrink-0">
                                        <img src={car.imageUrl} alt={car.carName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{car.carName}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status Column */}
                          <td className="py-4 px-6">
                            <span className="text-[14px] font-medium text-slate-600">
                              {firstBanner.status ? "Active" : "Disabled"}
                            </span>
                          </td>

                          {/* Action Column */}
                          <td className="py-4 px-6 flex items-center gap-6">
                            <div onClick={() => toggleStatus(firstBanner.id || firstBanner._id)} className={`relative inline-flex h-[28px] w-[85px] shrink-0 items-center rounded-full cursor-pointer transition-colors ${firstBanner.status ? "bg-[#00B050]" : "bg-[#990000]"}`}>
                              <span className={`absolute text-[11px] font-medium text-white transition-opacity ${firstBanner.status ? "left-2.5 opacity-100" : "opacity-0"}`}>Active</span>
                              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ease-in-out z-10 ${firstBanner.status ? "translate-x-[61px]" : "translate-x-1"}`} />
                              <span className={`absolute text-[11px] font-medium text-white transition-opacity ${firstBanner.status ? "opacity-0" : "right-2 opacity-100"}`}>Disabled</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => openEditModal(firstBanner)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                              <button onClick={() => openCloneModal(firstBanner)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Clone"><Copy size={20} /></button>
                              <button onClick={() => openDeleteModal(firstBanner)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* ========================================== */}
                      {/* 2. MULTIPLE VARIANTS (GROUP HEADER + ROWS) */}
                      {/* ========================================== */}
                      {hasMultipleVariants && (
                        <>
                          {/* GROUP HEADER (Strictly follows the Grid) 
                              - Col 1: Empty (Leaves Image column blank)
                              - Col 2: Group Title & Badge (Aligns under Banner Name)
                              - Col 3: Empty
                              - Col 4: Empty
                          */}
                          <tr
                            className={`border-y border-gray-200 transition-colors cursor-pointer select-none ${isExpanded ? 'bg-indigo-50/40' : 'bg-white hover:bg-slate-50'}`}
                            onClick={() => setExpandedGroups(prev => ({ ...prev, [group.bannerId]: !prev[group.bannerId] }))}
                          >
                            {/* 1. Empty Image Column */}
                            <td className="py-4 px-6 w-[120px]"></td>

                            {/* 2. Banner Name Column */}
                            <td className="py-4 px-6 min-w-[250px]">
                              <div className="flex items-center gap-3 group">
                                {/* Animated Chevron Icon */}
                                <div className={`text-slate-400 group-hover:text-[#0A3D81] transition-transform duration-300 ${isExpanded ? "rotate-90" : "rotate-0"}`}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                  </svg>
                                </div>

                                <span className="font-extrabold text-slate-800 text-[15px]">
                                  {BANNER_MAPPING.find(b => b.id === group.bannerId)?.name || group.bannerId}
                                  <span className="font-normal text-slate-400 text-[13px] ml-1.5">(Category)</span>
                                </span>

                                <span className="ml-2 text-[11px] bg-white text-[#0A3D81] font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                  {group.variants.length} Variants
                                </span>
                              </div>
                            </td>

                            {/* 3. Empty Status Column */}
                            <td className="py-4 px-6"></td>

                            {/* 4. Empty Action Column */}
                            <td className="py-4 px-6"></td>
                          </tr>

                          {/* VARIANTS LIST */}
                          {isExpanded && group.variants.map((banner) => {
                            return (
                              <tr
                                key={banner._id || banner.id}
                                className="bg-blue-50/40 border-l-4 border-blue-300 hover:bg-blue-50/70 transition-all duration-200"
                              >
                                {/* Image Column */}
                                <td className="py-4 px-6 w-[120px]">
                                  <div className="w-[60px] h-[40px] bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
                                    {banner.isCarSpecific && banner.carImages?.length > 0 ? (
                                      <ImageWithLoading src={banner.carImages[0].imageUrl} alt={banner.name} className="w-full h-full object-cover" />
                                    ) : banner.imageUrl ? (
                                      <ImageWithLoading src={banner.imageUrl} alt={banner.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[10px] text-gray-400">No Img</span>
                                    )}
                                  </div>
                                </td>

                                {/* Name Column */}
                                <td className="py-4 px-6 min-w-[250px]">
                                  <div className="flex flex-col gap-2">
                                    <span className="text-[14px] font-medium text-slate-800">{banner.name}</span>
                                    {banner.isCarSpecific && banner.carImages && banner.carImages.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {banner.carImages.map((car, idx) => (
                                          <div key={idx} className="flex items-center gap-2 p-1 pr-2.5 bg-white border border-gray-200 rounded-lg shadow-sm cursor-default" title={`Banner for ${car.carName}`}>
                                            <div className="w-7 h-7 bg-white rounded overflow-hidden border border-gray-100 flex-shrink-0">
                                              <img src={car.imageUrl} alt={car.carName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{car.carName}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Status Column */}
                                <td className="py-4 px-6">
                                  <span className="text-[14px] font-medium text-slate-600">
                                    {banner.status ? "Active" : "Disabled"}
                                  </span>
                                </td>

                                {/* Actions Column (Toggle + Icons) */}
                                <td className="py-4 px-6 flex items-center gap-6">
                                  <div onClick={() => toggleStatus(banner.id || banner._id)} className={`relative inline-flex h-[28px] w-[85px] shrink-0 items-center rounded-full cursor-pointer transition-colors ${banner.status ? "bg-[#00B050]" : "bg-[#990000]"}`}>
                                    <span className={`absolute text-[11px] font-medium text-white transition-opacity ${banner.status ? "left-2.5 opacity-100" : "opacity-0"}`}>Active</span>
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ease-in-out z-10 ${banner.status ? "translate-x-[61px]" : "translate-x-1"}`} />
                                    <span className={`absolute text-[11px] font-medium text-white transition-opacity ${banner.status ? "opacity-0" : "right-2 opacity-100"}`}>Disabled</span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <button onClick={() => openEditModal(banner)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => openCloneModal(banner)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Clone">
                                      <Copy size={20} />
                                    </button>
                                    <button onClick={() => openDeleteModal(banner)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      )}

                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Clone Confirmation Modal Overlay */}
        {isCloneModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 border border-white/20">

              <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">Clone Banner</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">
                You are duplicating <strong className="text-slate-800">{bannerToClone?.name}</strong>. Please enter a name for the new banner.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">New Banner Name</label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#11087C] focus:border-[#11087C] outline-none transition-all"
                  placeholder="e.g. Summer Promo Copy"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={closeCloneModal}
                  disabled={isCloning}
                  className="flex-1 px-4 py-3 text-sm font-bold border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={submitClone}
                  disabled={isCloning || !cloneName.trim()}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#11087C] hover:bg-indigo-800 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCloning ? 'Cloning...' : 'Confirm Clone'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && totalItems > 0 && (
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 gap-4">
            <span className="text-[13px] font-medium text-gray-700">
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-2 py-1.5 text-gray-600 hover:text-blue-600 text-[13px] font-medium disabled:opacity-50 flex items-center"
              >
                &lt; Previous
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`min-w-[28px] h-[28px] rounded px-2 transition-colors text-[13px] ${currentPage === pageNumber
                        ? "bg-[#0A3D81] text-white font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                  return <span key={pageNumber} className="px-1 text-gray-400">...</span>;
                }
                return null;
              })}

              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="px-2 py-1.5 text-gray-600 hover:text-blue-600 text-[13px] font-medium disabled:opacity-50 flex items-center"
              >
                Next &gt;
              </button>
            </div>
          </div>
        )}
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0b0c5b]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">

          <div className="bg-white shadow-2xl rounded-xl w-full max-w-[1200px] my-8 overflow-hidden border border-gray-200 transform transition-all scale-100 relative">
            <div className="p-8 md:p-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-[18px] font-bold text-gray-900 mb-8 tracking-wide">
                {editingId ? 'Edit banner placement' : 'Create new banner'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="flex flex-col lg:flex-row gap-10 mb-10">

                  {/* --- LEFT SIDE: Controls --- */}
                  <div className="flex-1 flex flex-col gap-8">

                    {/* Choose Banner Dropdown */}
                    {/* Choose Banner Dropdown */}
                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-2">Choose Banner</label>
                      {editingId ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                          required disabled
                        />
                      ) : (
                        <div className="relative">
                          <select
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none appearance-none bg-white text-gray-700 shadow-sm cursor-pointer focus:border-[#0A3D81]"
                            required
                          >
                            <option value="" disabled>Choose from list</option>
                            {BANNER_MAPPING.map((option, index) => (
                              <option key={index} value={option.name}>{option.name}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      )}

                      {/* ✅ ADD REFERENCE IMAGE PREVIEW HERE */}
                      {BANNER_MAPPING.find(b => b.name === formData.name)?.referenceImage && (
                        <div className="mt-4 p-3 bg-[#EEF1F6] border border-gray-200 rounded-lg shadow-inner animate-in fade-in duration-300">
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                              Game Position Reference
                            </label>
                          </div>
                          <div className="w-full h-[120px] bg-slate-200 rounded overflow-hidden flex items-center justify-center border border-gray-300 relative">
                            {/* Loading spinner while image fetches */}
                            <div className="absolute inset-0 flex items-center justify-center animate-pulse z-0">
                              <span className="text-xs text-gray-400 font-medium">Loading map view...</span>
                            </div>
                            <img
                              src={BANNER_MAPPING.find(b => b.name === formData.name)?.referenceImage}
                              alt={`${formData.name} in-game location`}
                              className="w-full h-full object-contain relative z-10"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-2 italic leading-tight">
                            {BANNER_MAPPING.find(b => b.name === formData.name)?.description}
                          </p>
                        </div>
                      )}
                      {/* ✅ END REFERENCE IMAGE */}

                    </div>

                    {/* Apply to specific cars? */}
                    <div>
                      <label className="block text-[13px] font-bold text-gray-800 mb-3">Apply to specific cars?</label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${!applyToSpecificCars ? 'border-[#0A3D81]' : 'border-gray-400 group-hover:border-[#0A3D81]'}`}>
                            {!applyToSpecificCars && <div className="w-2.5 h-2.5 bg-[#0A3D81] rounded-full"></div>}
                          </div>
                          <input type="radio" checked={!applyToSpecificCars} onChange={() => setApplyToSpecificCars(false)} className="hidden" />
                          <span className="text-[13px] text-gray-800 font-medium">No</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${applyToSpecificCars ? 'border-[#0A3D81]' : 'border-gray-400 group-hover:border-[#0A3D81]'}`}>
                            {applyToSpecificCars && <div className="w-2.5 h-2.5 bg-[#0A3D81] rounded-full"></div>}
                          </div>
                          <input type="radio" checked={applyToSpecificCars} onChange={() => setApplyToSpecificCars(true)} className="hidden" />
                          <span className="text-[13px] text-gray-800 font-medium">Yes</span>
                        </label>
                      </div>
                    </div>

                    {/* Upload and Status Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                      {/* Upload Banner Image (Original UI, Hidden if Specific Cars is selected) */}
                      {!applyToSpecificCars && (
                        <div>
                          <label className="block text-[13px] font-bold text-gray-800 mb-2">Upload Banner Image</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              id="file-upload"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                              required={!editingId && !applyToSpecificCars}
                            />
                            <label
                              htmlFor="file-upload"
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] px-4 py-2 rounded border border-gray-200 cursor-pointer transition-colors shrink-0"
                            >
                              Choose file
                            </label>
                            <span className="text-[13px] text-gray-500 truncate flex-1 min-w-[100px]">
                              {formData.file ? formData.file.name : 'No file selected'}
                            </span>

                          </div>
                        </div>
                      )}

                      {/* Status Radio Buttons (Always visible) */}
                      <div className={!applyToSpecificCars ? 'ml-10' : ''}>
                        <label className="block text-[13px] font-bold text-gray-800 mb-3">Status</label>
                        <div className="flex items-center gap-6 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.status ? 'border-[#0A3D81]' : 'border-gray-400 group-hover:border-[#0A3D81]'}`}>
                              {formData.status && <div className="w-2.5 h-2.5 bg-[#0A3D81] rounded-full"></div>}
                            </div>
                            <input
                              type="radio"
                              name="status"
                              value="true"
                              checked={formData.status}
                              onChange={() => setFormData(prev => ({ ...prev, status: true }))}
                              className="hidden"
                            />
                            <span className="text-[13px] text-gray-800 font-medium">Active</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${!formData.status ? 'border-[#0A3D81]' : 'border-gray-400 group-hover:border-[#0A3D81]'}`}>
                              {!formData.status && <div className="w-2.5 h-2.5 bg-[#0A3D81] rounded-full"></div>}
                            </div>
                            <input
                              type="radio"
                              name="status"
                              value="false"
                              checked={!formData.status}
                              onChange={() => setFormData(prev => ({ ...prev, status: false }))}
                              className="hidden"
                            />
                            <span className="text-[13px] text-gray-800 font-medium">Inactive</span>
                          </label>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* --- RIGHT SIDE: Preview / Spacer --- */}
                  {!applyToSpecificCars ? (
                    <div className="flex-1">
                      <label className="block text-[13px] font-bold text-gray-800 mb-2">Banner Preview</label>
                      <div className="w-full h-[220px] bg-[#EEF1F6] border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center shadow-inner relative">
                        {(formData.file || formData.imageUrl) ? (
                          <>
                            {!imagePrevLoaded && (
                              <div className="absolute inset-0 flex items-center justify-center bg-[#EEF1F6] animate-pulse z-0">
                                <svg className="animate-spin h-6 w-6 text-[#0A3D81]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              </div>
                            )}
                            <img
                              src={formData.file ? URL.createObjectURL(formData.file) : formData.imageUrl}
                              alt="Preview"
                              className={`w-full h-full object-contain relative z-10 transition-opacity duration-300 ${imagePrevLoaded ? 'opacity-100' : 'opacity-0'}`}
                              onLoad={() => setImagePrevLoaded(true)}
                            />
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm font-medium">No image to preview</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Spacer to keep the layout from stretching when specific cars is selected */
                    <div className="flex-1 hidden lg:block"></div>
                  )}

                </div>

                {/* --- SPECIFIC CARS GRID UI (Only visible when Yes is selected) --- */}
                {applyToSpecificCars && (
                  <div className="mb-10 p-6 bg-gray-50 rounded-xl border border-gray-200">

                    {/* Search & Bulk Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                      <div className="relative w-full md:w-1/3">
                        <input
                          type="text"
                          placeholder="Search Car 🔍"
                          value={carSearchQuery}
                          onChange={handleCarSearch}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-[#0A3D81]"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => toggleSelectAllCars(true)} className="text-[13px] font-semibold text-[#0A3D81] hover:underline">Select All</button>
                        <span className="text-gray-300">|</span>
                        <button type="button" onClick={() => toggleSelectAllCars(false)} className="text-[13px] font-semibold text-red-600 hover:underline">Clear All</button>
                      </div>
                    </div>

                    {/* Car Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {filteredCars.map((car) => (
                        <div key={car.id} className={`bg-white border rounded-xl p-4 flex flex-col gap-4 shadow-sm transition-colors ${car.enabled ? 'border-[#0A3D81] ring-1 ring-[#0A3D81]/20' : 'border-gray-200'}`}>

                          {/* Card Header (Name + Toggle) */}
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[14px] text-gray-800 flex items-center gap-2"> {car.name}</span>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={car.enabled}
                                onChange={() => toggleSpecificCar(car.id)}
                                className="w-4 h-4 rounded text-[#0A3D81] focus:ring-[#0A3D81] border-gray-300 cursor-pointer"
                              />
                              <span className="text-[12px] font-medium text-gray-600">Enable</span>
                            </label>
                          </div>

                          {/* Upload Action */}
                          <div className={!car.enabled ? 'opacity-50 pointer-events-none' : ''}>
                            <input
                              type="file"
                              id={`file-${car.id}`}
                              accept="image/*"
                              onChange={(e) => handleSpecificCarFile(car.id, e.target.files[0])}
                              className="hidden"
                            />
                            <label
                              htmlFor={`file-${car.id}`}
                              className="w-full block text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-semibold py-2 rounded cursor-pointer transition-colors border border-gray-300"
                            >
                              Upload Image
                            </label>
                          </div>

                          {/* Image Preview */}
                          <div className={`h-28 bg-[#EEF1F6] rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden ${!car.enabled ? 'opacity-50' : ''}`}>
                            {car.preview ? (
                              <img src={car.preview} className="w-full h-full object-contain bg-white" alt={`${car.name} preview`} />
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium">Preview Img</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full h-px bg-gray-100 mb-6"></div>

                {/* --- FOOTER BUTTONS --- */}
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#0b0c5b] hover:bg-blue-950 text-white w-36 py-2.5 rounded-lg text-[14px] font-semibold transition-all active:scale-95 flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-white border border-gray-400 text-gray-800 w-32 py-2.5 rounded-lg text-[14px] font-semibold transition-all active:scale-95 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center border border-white/20">
            <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">Delete Banner?</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">
              Are you sure you want to remove <strong className="text-slate-800">{deletingBanner?.name}</strong>? This action is permanent.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full px-6 py-3 text-sm font-bold text-white bg-[#990000] hover:bg-red-800 rounded-xl transition-all shadow-md active:scale-95"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Banner'}
              </button>
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="w-full px-6 py-3 text-sm font-bold border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardBanner;