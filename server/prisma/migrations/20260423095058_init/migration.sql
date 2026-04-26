-- CreateTable
CREATE TABLE `Employee` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('GURU', 'KARYAWAN', 'ADMIN') NOT NULL DEFAULT 'GURU',
    `transportRate` DOUBLE NOT NULL DEFAULT 0,
    `fingerId` VARCHAR(191) NULL,
    `cardNo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,

    INDEX `Attendance_employeeId_idx`(`employeeId`),
    INDEX `Attendance_timestamp_idx`(`timestamp`),
    UNIQUE INDEX `Attendance_employeeId_timestamp_key`(`employeeId`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeviceSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '192.168.8.200',
    `port` INTEGER NOT NULL DEFAULT 4370,
    `lastSync` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportHonorExport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `employeeId` INTEGER NOT NULL,
    `totalDays` INTEGER NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TransportHonorExport_employeeId_idx`(`employeeId`),
    INDEX `TransportHonorExport_month_year_idx`(`month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportHonorExport` ADD CONSTRAINT `TransportHonorExport_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
