import { IScheduler, SchedRoom, SchedSection, TimeSlot, Course } from "./IScheduler";

export default class Scheduler implements IScheduler {
    private roomToTimeSlot: Map<SchedRoom, TimeSlot[]>;
    private courseToTimeSlot: Map<Course, TimeSlot[]>;

    constructor() {
        this.roomToTimeSlot = new Map();
        this.courseToTimeSlot = new Map();
    }

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let output: Array<[SchedRoom, SchedSection, TimeSlot]> = [];

        rooms.sort((a: SchedRoom, b: SchedRoom) => {
            if (a.rooms_seats > b.rooms_seats) {
                return 1;
            } else if (a.rooms_seats < b.rooms_seats) {
                return -1;
            } else {
                return 0;
            }
        });

        for (let section of sections) {
            let resultRoom: SchedRoom = this.searchRoom(section, rooms);

            if (resultRoom === null) {
                continue;
            }

            let processedSection = this.processTimeSlot(section, resultRoom);
            if (processedSection !== null && processedSection !== undefined) {
                output.push(processedSection);
            }
        }

        return output;
    }

    /**
     *
     * @param section
     * @param room
     * @return The processed result if processable, otherwise return null
     */
    private processTimeSlot(section: SchedSection, room: SchedRoom): [SchedRoom, SchedSection, TimeSlot] {
        const timeSlots: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
            "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
            "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
            "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
            "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

        let result: any;
        for (let timeSlot of timeSlots) {
            if (this.canProcessTimeSlot(section, room, timeSlot)) {
                result = [room, section, timeSlot];
                break;
            }
        }

        return result;
    }

    /**
     *
     * @param section
     * @param room
     * @param timeSlot
     * @return Return true if the room is available and section has no overlap, false otherwise
     */
    private canProcessTimeSlot(section: SchedSection, room: SchedRoom, timeSlot: TimeSlot): boolean {
        return this.checkRoomAvailablity(room, timeSlot) && this.checkSectionOverlap(section, timeSlot);
    }

    /**
     *
     * @param section
     * @param timeSlot
     * @return True if the section has no overlap, false otherwise
     */
    private checkSectionOverlap(section: SchedSection, timeSlot: TimeSlot): boolean {
        const course: Course = { courses_dept: section.courses_dept, courses_id: section.courses_id };

        if (!this.courseToTimeSlot.has(course)) {
            this.courseToTimeSlot.set(course, [timeSlot]);
            return true;
        }

        let timeSlots: TimeSlot[] = this.courseToTimeSlot.get(course);
        if (timeSlots.includes(timeSlot)) {
            return false;
        } else {
            timeSlots.push(timeSlot);
            return true;
        }
    }

    /**
     *
     * @param room
     * @param timeSlot
     * @return True if the room is available at given time, false otherwise.
     */
    private checkRoomAvailablity(room: SchedRoom, timeSlot: TimeSlot): boolean {
        if (!this.roomToTimeSlot.has(room)) {
            this.roomToTimeSlot.set(room, [timeSlot]);
            return true;
        }

        let timeSlots: TimeSlot[] = this.roomToTimeSlot.get(room);
        if (timeSlots.includes(timeSlot)) {
            return false;
        } else {
            timeSlots.push(timeSlot);
            return true;
        }
    }

    /**
     *
     * @param section
     * @param rooms The rooms has to be a sorted array
     * @returns Array of SchedRoom and SchedSection.
     */
    private searchRoom(section: SchedSection, rooms: SchedRoom[]): SchedRoom {
        const enrolment: number = this.calcEnrolment(section);
        let result: SchedRoom = null;
        let start: number = 0;
        let end: number = rooms.length - 1;

        while (start <= end) {
            let mid: number = start + Math.floor((end - start) / 2);
            let roomSize: number = rooms[mid].rooms_seats;

            if (enrolment > roomSize) {
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }

        if (start >= rooms.length) {
            result = null;
        } else {
            result = rooms[start];
        }

        return result;
    }

    private calcEnrolment(section: SchedSection): number {
        const enrolment: number = section.courses_pass + section.courses_fail + section.courses_audit;
        return enrolment;
    }
}
