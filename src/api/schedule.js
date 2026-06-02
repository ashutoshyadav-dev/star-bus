import api from "./client";

/* ─────────────────────────────
   Schedule APIs
───────────────────────────── */

export const getAllSchedules = (from) =>
  api.get("/schedules", {
    params: { from },
  });

export const searchSchedulesByRoute = (routeId, date) =>
  api.get("/schedules", {
    params: { routeId, date },
  });

export const searchSchedulesByBus = (busId, date) =>
  api.get("/schedules", {
    params: { busId, date },
  });

export const getScheduleById = (id) =>
  api.get(`/schedules/${id}`);

export const createSchedule = (payload) =>
  api.post("/schedules", payload);

export const updateScheduleStatus = (id, payload) =>
  api.patch(`/schedules/${id}/status`, payload);

export const toggleScheduleBooking = (id, open) =>
  api.patch(`/schedules/${id}/booking?open=${open}`);

export const searchAvailableSchedules = (fromStationId, toStationId, date) =>
    api.get('/schedules/search', {
        params: { fromStationId, toStationId, date }
    });
/* ─────────────────────────────
   Seat Inventory APIs
───────────────────────────── */

// export const getScheduleSeats = (scheduleId, availableOnly = false) =>
//   api.get(`/scheduleSeatInventory/schedules/${scheduleId}/seats`, {
//     params: { availableOnly },
//   });

// In schedule.js API file — add this helper
export const getScheduleSeats = (scheduleId, fromStopSeq, toStopSeq) =>
  api.get(`/scheduleSeatInventory/schedules/${scheduleId}/seats`, {
    params: {
      fromStopSequence: fromStopSeq,
      toStopSequence: toStopSeq,
    },
  });

export const getScheduleSeatById = (id) =>
  api.get(`/scheduleSeatInventory/schedule-seats/${id}`);

export const initialiseScheduleSeats = (scheduleId) =>
  api.post(`/scheduleSeatInventory/schedules/${scheduleId}/seats/initialise`);

export const lockScheduleSeat = (id, bookingId, lockExpiresAt) =>
  api.patch(
    `/scheduleSeatInventory/schedule-seats/${id}/lock`,
    null,
    {
      params: {
        bookingId,
        lockExpiresAt,
      },
    }
  );

 
export const lockSeatForJourney = (seatId, scheduleId, bookingId, fromSeq, toSeq, lockExpiresAt) =>
  api.patch(
    `/scheduleSeatInventory/schedules/${scheduleId}/seats/${seatId}/lock-journey`,
    null,                              // ← no body
    {
      params: { bookingId, fromStopSequence: fromSeq, toStopSequence: toSeq, lockExpiresAt },
    }
  );

export const confirmScheduleSeatBooking = (id, bookingId) =>
  api.patch(
    `/scheduleSeatInventory/schedule-seats/${id}/confirm`,
    null,
    {
      params: { bookingId },
    }
  );

export const releaseScheduleSeat = (id) =>
  api.patch(`/scheduleSeatInventory/schedule-seats/${id}/release`);


/* ─────────────────────────────
   Duty Assignment APIs
───────────────────────────── */

export const getDutyAssignmentById = (id) =>
  api.get(`/duty-assignments/${id}`);

export const getDutyAssignmentsBySchedule = (scheduleId) =>
  api.get(`/duty-assignments/schedule/${scheduleId}`);

export const getDutyAssignmentsByStaff = (staffUserId) =>
  api.get(`/duty-assignments/staff/${staffUserId}`);

export const assignDuty = (payload) =>
  api.post("/duty-assignments", payload);

export const unassignDuty = (id) =>
  api.delete(`/duty-assignments/${id}`);

export const checkInDuty = (id, payload = {}) =>
  api.patch(`/duty-assignments/${id}/check-in`, payload);

export const checkOutDuty = (id, payload = {}) =>
  api.patch(`/duty-assignments/${id}/check-out`, payload);