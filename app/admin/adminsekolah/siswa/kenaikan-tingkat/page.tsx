"use client";

import PromotionForm from "@/components/promotion/PromotionForm";
import PromotionPreview from "@/components/promotion/PromotionPreview";
import PromotionSummary from "@/components/promotion/PromotionSummary";
import PromotionConfirmModal from "@/components/promotion/PromotionConfirmModal";

import { usePromotion } from "@/hooks/usePromotion";

export default function PromotionPage() {
    const {
        loading,
        processing,

        currentAcademicYear,
        nextAcademicYear,

        summary,
        preview,

        selectedStudents,

        loadPreview,
        processPromotion,
        toggleStudent,

        openConfirm,
        closeConfirm,
        confirmOpen,
    } = usePromotion();

    return (
        <>
            <section className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h3>Kenaikan Tingkat</h3>
                        </div>

                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item">
                                    Admin Sekolah
                                </li>

                                <li className="breadcrumb-item">
                                    Siswa
                                </li>

                                <li className="breadcrumb-item active">
                                    Kenaikan Tingkat
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            <section className="content">

                <div className="container-fluid">

                    <div className="row">

                        <div className="col-lg-4">

                            <PromotionForm
                                loading={loading}
                                currentAcademicYear={currentAcademicYear}
                                nextAcademicYear={nextAcademicYear}
                                onPreview={loadPreview}
                            />

                        </div>

                        <div className="col-lg-8">

                            <PromotionSummary
                                summary={summary}
                            />

                        </div>

                    </div>

                    <div className="row mt-3">

                        <div className="col-12">

                            <PromotionPreview
                                loading={loading}
                                students={preview}
                                onToggle={toggleStudent}
                                onProcess={openConfirm}
                            />

                        </div>

                    </div>

                </div>

            </section>

            <PromotionConfirmModal
                open={confirmOpen}
                loading={processing}
                total={selectedStudents.length}
                currentAcademicYear={currentAcademicYear}
                nextAcademicYear={nextAcademicYear}
                onClose={closeConfirm}
                onConfirm={processPromotion}
            />
        </>
    );
}