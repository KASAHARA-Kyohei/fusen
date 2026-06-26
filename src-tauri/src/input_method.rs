#[cfg(target_os = "macos")]
#[allow(unsafe_code)]
mod platform {
    use std::ffi::c_void;

    type CFTypeRef = *const c_void;
    type TISInputSourceRef = *const c_void;

    #[link(name = "Carbon", kind = "framework")]
    unsafe extern "C" {
        fn TISCopyCurrentASCIICapableKeyboardInputSource() -> TISInputSourceRef;
        fn TISSelectInputSource(input_source: TISInputSourceRef) -> i32;
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    unsafe extern "C" {
        fn CFRelease(cf: CFTypeRef);
    }

    pub fn switch_to_alphanumeric_input() -> Result<(), String> {
        // SAFETY: Carbon returns a retained input source reference or null. The pointer is only
        // passed back to Carbon/CoreFoundation APIs and is released exactly once after selection.
        unsafe {
            let source = TISCopyCurrentASCIICapableKeyboardInputSource();
            if source.is_null() {
                return Err("No ASCII-capable input source found".to_string());
            }

            let status = TISSelectInputSource(source);
            CFRelease(source.cast());

            if status == 0 {
                Ok(())
            } else {
                Err(format!("TISSelectInputSource failed with status {status}"))
            }
        }
    }
}

#[cfg(target_os = "windows")]
#[allow(unsafe_code)]
mod platform {
    use std::ffi::c_void;

    type Bool = i32;
    type Himc = *mut c_void;
    type Hwnd = *mut c_void;

    #[link(name = "imm32")]
    unsafe extern "system" {
        fn ImmGetContext(hwnd: Hwnd) -> Himc;
        fn ImmReleaseContext(hwnd: Hwnd, himc: Himc) -> Bool;
        fn ImmSetOpenStatus(himc: Himc, open: Bool) -> Bool;
    }

    #[link(name = "user32")]
    unsafe extern "system" {
        fn GetForegroundWindow() -> Hwnd;
    }

    pub fn switch_to_alphanumeric_input() -> Result<(), String> {
        // SAFETY: The HWND/HIMC handles come from Win32 APIs. They are checked for null before use,
        // and the input context acquired by ImmGetContext is always released with ImmReleaseContext.
        unsafe {
            let hwnd = GetForegroundWindow();
            let mut switched = false;

            if !hwnd.is_null() {
                let himc = ImmGetContext(hwnd);
                if !himc.is_null() {
                    switched = ImmSetOpenStatus(himc, 0) != 0;
                    ImmReleaseContext(hwnd, himc);
                }
            }

            if switched {
                Ok(())
            } else {
                Err("Could not switch Windows input method".to_string())
            }
        }
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod platform {
    pub fn switch_to_alphanumeric_input() -> Result<(), String> {
        Ok(())
    }
}

pub use platform::switch_to_alphanumeric_input;
