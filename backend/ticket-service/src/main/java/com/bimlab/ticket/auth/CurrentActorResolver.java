package com.bimlab.ticket.auth;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class CurrentActorResolver implements HandlerMethodArgumentResolver {
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentActor.class) && parameter.getParameterType() == String.class;
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer container, NativeWebRequest request,
                                  WebDataBinderFactory binderFactory) {
        Object user = request.getAttribute(SessionInterceptor.USER_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        if (!(user instanceof AuthService.CurrentUser current)) {
            throw new AuthExceptions.AuthenticationRequired("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        }
        return current.member().id();
    }
}
