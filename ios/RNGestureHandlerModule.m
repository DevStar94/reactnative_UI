#import "RNGestureHandlerModule.h"

#import <React/RCTLog.h>
#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>

#import "RNGestureHandlerState.h"
#import "RNGestureHandler.h"

@interface RNGestureHandlerModule () <RNGestureHandlerEventEmitter>

@end


@interface RNDummyViewManager : RCTViewManager
@end


@implementation RNDummyViewManager

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(onGestureHandlerEvent, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onGestureHandlerStateChange, RCTDirectEventBlock)

@end


@implementation RNGestureHandlerModule
{
    NSMutableDictionary<NSNumber *, NSMutableArray<RNGestureHandler *>* > *_gestureHandlers;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

- (void)setBridge:(RCTBridge *)bridge
{
    [super setBridge:bridge];

    _gestureHandlers = [NSMutableDictionary new];
}

RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSNumber *)viewTag withName:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    static NSDictionary *map;
    static dispatch_once_t mapToken;
    dispatch_once(&mapToken, ^{
        map = @{
                @"PanGestureHandler" : [RNPanGestureHandler class],
                @"TapGestureHandler" : [RNTapGestureHandler class],
                @"LongPressGestureHandler": [RNLongPressGestureHandler class],
                @"NativeViewGestureHandler": [RNNativeViewGestureHandler class],
                };
    });
    
    Class nodeClass = map[handlerName];
    if (!nodeClass) {
        RCTLogError(@"Gesture handler type %@ is not supported", handlerName);
        return;
    }
    
    RNGestureHandler *gestureHandler = [[nodeClass alloc] initWithTag:handlerTag config:config];
    NSMutableArray *handlersArray = _gestureHandlers[viewTag];
    if (handlersArray == nil) {
        handlersArray = [NSMutableArray new];
        _gestureHandlers[viewTag] = handlersArray;
    }
    [handlersArray addObject:gestureHandler];
    gestureHandler.emitter = self;
    
    UIView *view = [self.bridge.uiManager viewForReactTag:viewTag];
    [gestureHandler bindToView:view];
}

RCT_EXPORT_METHOD(dropGestureHandlersForView:(nonnull NSNumber *)viewTag)
{
    NSMutableArray *handlersArray = _gestureHandlers[viewTag];
    for (RNGestureHandler *handler in handlersArray) {
        [handler unbindFromView];
    }
    [_gestureHandlers removeObjectForKey:viewTag];
}

RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    // TODO: js responder support
}

RCT_EXPORT_METHOD(handleClearJSResponder)
{
    // TODO: js responder support
}

#pragma mark Events

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onGestureHandlerEvent", @"onGestureHandlerStateChange"];
}

- (void)sendTouchEvent:(RNGestureHandlerEvent *)event
{
    [self.bridge.eventDispatcher sendEvent:event];
}

- (void)sendStateChangeEvent:(RNGestureHandlerStateChange *)event
{
    [self.bridge.eventDispatcher sendEvent:event];
}

#pragma mark Module Constants

- (NSDictionary *)constantsToExport
{
    return @{ @"State": @{
                      @"UNDETERMINED": @(RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(RNGestureHandlerStateBegan),
                      @"ACTIVE": @(RNGestureHandlerStateActive),
                      @"CANCELLED": @(RNGestureHandlerStateCancelled),
                      @"FAILED": @(RNGestureHandlerStateFailed),
                      @"END": @(RNGestureHandlerStateEnd)
                      }
              };
}



@end
  
