import {EventEmitter} from 'events';
// TODO: In reality it uses objects from "readable-stream"!!!
// Fix it once the readable-stream definitions are available.
import {Transform, TransformOptions} from 'stream';

/**
 * Shared Methods
 *
 * All tracker objects described below have the following methods, they, along with the event comprise the interface
 * for consumers of tracker objects.
 */
class TrackerBase extends EventEmitter {
  /**
   * var completed = tracker.completed()
   *
   * Returns the ratio of completed work to work to be done. Range of 0 to 1.
   */
  completed(): number;

  /**
   * tracker.finish()
   *
   * Marks the tracker as completed. With a TrackerGroup this marks all of its components as completed.
   *
   * Marks all of the components of this tracker as finished, which in turn means that tracker.completed() for this
   * will now be 1.
   *
   * This will result in one or more change events being emitted.
   */
  finish(): void;
}

// TODO: How do we manage events ?
/**
 * Events
 *
 * All tracker objects emit change events with the following arguments:
 *
 * function (name, completed, tracker)
 *
 * name is the name of the tracker that originally emitted the event, or if it didn't have one, the first containing tracker group that had one.
 * completed is the percent complete (as returned by tracker.completed() method).
 * tracker is the tracker object that you are listening for events on.
 */

/**
 * TrackerGroup
 */
export class TrackerGroup extends TrackerBase {
  /**
   * var tracker = new TrackerGroup(name)
   *
   * name (optional) - The name of this tracker group, used in change notifications if the component updating didn't
   * have a name. Defaults to undefined.
   *
   * Creates a new empty tracker aggregation group. These are trackers whose completion status is determined by the
   * completion status of other trackers.
   */
  constructor(name?: string);

  /**
   * tracker.addUnit(otherTracker, weight)
   *
   * otherTracker - Any of the other are-we-there-yet tracker objects
   * weight (optional) - The weight to give the tracker, defaults to 1.
   *
   * Adds the otherTracker to this aggregation group. The weight determines how long you expect this tracker to take to
   * complete in proportion to other units. So for instance, if you add one tracker with a weight of 1 and another with
   * a weight of 2, you're saying the second will take twice as long to complete as the first. As such, the first will
   * account for 33% of the completion of this tracker and the second will account for the other 67%.
   *
   * Returns otherTracker.
   */
  addUnit<T extends Tracker>(otherTracker: T, weight?: number): T;
  addUnit<T extends TrackerGroup>(otherTracker: T, weight?: number): T;
  addUnit<T extends TrackerStream>(otherTracker: T, weight?: number): T;

  /**
   * var subGroup = tracker.newGroup(name, weight)
   *
   * The above is exactly equivalent to:
   *
   * var subGroup = tracker.addUnit(new TrackerGroup(name), weight)
   */
  newGroup(name?: string, weight?: number): TrackerGroup;

  /**
   * var subItem = tracker.newItem(name, todo, weight)
   *
   * The above is exactly equivalent to:
   *
   * var subItem = tracker.addUnit(new Tracker(name, todo), weight)
   */
  newItem(name?: string, todo?: number, weight?: number): Tracker;

  /**
   * var subStream = tracker.newStream(name, todo, weight)
   *
   * The above is exactly equivalent to:
   *
   * var subStream = tracker.addUnit(new TrackerStream(name, todo), weight)
   */
  newStream(name?: string, todo?: number, weight?: number): TrackerStream;

  /**
   * console.log( tracker.debug() )
   *
   * Returns a tree showing the completion of this tracker group and all of its children, including recursively
   * entering all of the children.
   */
  debug(): string;
}

/**
 * Tracker
 */
export class Tracker extends TrackerBase {
  /**
   * var tracker = new Tracker(name, todo)
   *
   * name (optional) The name of this counter to report in change events. Defaults to undefined.
   * todo (optional) The amount of work todo (a number). Defaults to 0.
   *
   * Ordinarily these are constructed as a part of a tracker group (via newItem).
   */
  constructor(name?: string, todo?: number);

  /**
   * var completed = tracker.completed()
   *
   * Returns the ratio of completed work to work to be done. Range of 0 to 1. If total work to be done is 0 then it
   * will return 0.
   */
  completed(): number;

  /**
   * tracker.addWork(todo)
   *
   * todo A number to add to the amount of work to be done.
   *
   * Increases the amount of work to be done, thus decreasing the completion percentage. Triggers a change event.
   */
  addWork(todo: number): void;

  /**
   * tracker.completeWork(completed)
   *
   * completed A number to add to the work complete
   *
   * Increase the amount of work complete, thus increasing the completion percentage. Will never increase the work
   * completed past the amount of work todo. That is, percentages > 100% are not allowed. Triggers a change event.
   */
  completedWork(completed: number): void;

  /**
   * tracker.finish()
   *
   * Marks this tracker as finished, tracker.completed() will now be 1. Triggers a change event.
   */
  finish(): void;
}

// This class extends the prototype of Transform and then uses:
// delegate(TrackerStream.prototype, 'tracker')
//   .method('completed')
//   .method('addWork')
// It means that we have something like:
// TrackerStream.prototype.completed = function() {return this.tracker.completed.apply(this.tracker, arguments);};
// TrackerStream.prototype.addWork = function() {return this.tracker.addWork.apply(this.tracker, arguments);};
/**
 * TrackerStream
 */
export class TrackerStream extends Transform {
  /**
   * var tracker = new TrackerStream(name, size, options)
   *
   * name (optional) The name of this counter to report in change events. Defaults to undefined.
   * size (optional) The number of bytes being sent through this stream.
   * options (optional) A hash of stream options
   *
   * The tracker stream object is a pass through stream that updates an internal tracker object each time a block
   * passes through. It's intended to track downloads, file extraction and other related activities. You use it by
   * piping your data source into it and then using it as your data source.
   *
   * If your data has a length attribute then that's used as the amount of work completed when the chunk is passed
   * through. If it does not (eg, object streams) then each chunk counts as completing 1 unit of work, so your size
   * should be the total number of objects being streamed.
   */
  constructor(name?: string, size?: number, options?: TransformOptions);

  /**
   * tracker.addWork(todo)
   *
   * todo Increase the expected overall size by todo bytes.
   *
   * Increases the amount of work to be done, thus decreasing the completion percentage. Triggers a change event.
   */
  addWork(todo: number): void;
}
